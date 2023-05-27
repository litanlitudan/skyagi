import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";

function parseList(text: string): string[] {
	const lines = text.trim().split('\n');
	return lines.map(line => line.replace(/^\s*\d+\.\s*/, '').trim());
}

export class GenerativeAgent {
    id: string;
    name: string;
	age: number;
	personality: string;
	status: string;
	llm: BaseLanguageModel;
	memoryRetriever: TimeWeightedVectorStoreRetriever;

	maxTokensLimit: number = 1200;
	reflectionThreshold: number = 8;
	memoryImportance: number = 0.0;

    // TODO:
    // * support embeddings from different LLM models
    // * may define our own queryfunction
    // * standardize sql query later
    // * get the llm for the agent
    constructor(supabase: any, conversation_id: string, agent_id: string, llm: string) {
        // get agent's profile
        const { data: profiles } = supabase
            .from('agent')
		    .select('id name age personality')
		    .eq('id', agent_id);
        this.id = profiles.id;
        this.name = profiles.name;
        this.age = profiles.age;
        this.personality = profiles.personality;

        // create retriever
        const vectorStore = new SupabaseVectorStore(
            new OpenAIEmbeddings(),
            {
                supabase,
                tableName: "memory"
            }
        );
        this.memoryRetriever = new TimeWeightedVectorStoreRetriever({
            vectorStore,
            otherScoreKeys: "importance",
            k: 15}
        );

        // get all memories
        const { data: allMemories } = supabase
            .from('memory')
		    .select('id content cur_status last_access_time')
		    .eq('conversation_id', conversation_id)
		    .eq('agent_id', agent_id)
            .order('last_access_time', { ascending: true });
        this.status = allMemories[allMemories.length - 1].cur_status;
 
        // add all memories to retriever
        for (const memory of allMemories) {
            this.memoryRetriever.addDocuments(memory.content);
        }
    }

    private fetchMemories(observation: string): Document[] {
		return this.memoryRetriever.getRelevantDocuments(observation);
	}

	private computeAgentSummary(): string {
		const prompt = PromptTemplate.fromTemplate(
			`How would you summarize ${this.name}'s core characteristics given the` +
				` following statements:\n` +
				`{related_memories}` +
				`Do not embellish.` +
				`\n\nSummary: `
		);
		const relevant_memories = this.fetchMemories(`${this.name}'s core characteristics`);
		const relevant_memories_str = relevant_memories.map(mem => mem.pageContent).join('\n');
		const chain = LLMChain(this.llm, prompt);
		return chain.run({ name: this.name, related_memories: relevant_memories_str }).trim();
	}

    private getEntityFromObservation(observation: string): string {
		const prompt = PromptTemplate.fromTemplate(
			`What is the observed entity in the following observation? ${observation}` + `\nEntity=`
		);
		const chain = LLMChain({llm: this.llm, prompt});
		return chain.run({ observation: observation }).trim();
	}

    private getEntityAction(observation: string, entity_name: string): string {
		const prompt = PromptTemplate.fromTemplate(
			`What is the {entity} doing in the following observation? ${observation}` +
				`\nThe {entity} is`
		);
		const chain = LLMChain({llm: this.llm, prompt});
		return chain.run({ entity: entity_name, observation: observation }).trim();
	}

    private formatMemoriesToSummarize(relevant_memories: Document[]): string {
		const content_strs = new Set<string>();
		const content: string[] = [];

		for (const mem of relevant_memories) {
			if (content_strs.has(mem.pageContent)) {

				continue;
			}

			content_strs.add(mem.pageContent);
			const created_time = mem.metadata.created_at.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true
			});

			content.push(`- ${created_time}: ${mem.pageContent.trim()}`);
		}

		return content.join('\n');
	}

    // TODO
    // * cache summary in supabase memory table
	private getSummary(force_refresh: boolean = false): string {
		let summary = this.computeAgentSummary();

		return (
			`Name: ${this.name} (age: ${this.age})` +
			`\nInnate traits: ${this.personality}` +
			`\n${summary}`
		);
	}

    private summarizeRelatedMemories(observation: string): string {
		const entity_name = this.getEntityFromObservation(observation);
		const entity_action = this.getEntityAction(observation, entity_name);
		const q1 = `What is the relationship between ${this.name} and ${entity_name}`;
		let relevant_memories = this.fetchMemories(q1);
		const q2 = `${entity_name} is ${entity_action}`;
		relevant_memories.concat(this.fetchMemories(q2));

		const context_str = this.formatMemoriesToSummarize(relevant_memories);
		const prompt = PromptTemplate.fromTemplate(
			`${q1}?\nContext from memory:\n${context_str}\nRelevant context: `
		);

		const chain = LLMChain({llm: this.llm, prompt});
		return chain.run({ q1: q1, context_str: context_str.trim() }).trim();
	}

    private getMemoriesUntilLimit(consumed_tokens: number): string {
		const result: string[] = [];

		for (const doc of this.memoryRetriever.memory_stream.slice().reverse()) {
			if (consumed_tokens >= this.maxTokensLimit) {
				break;
			}

			consumed_tokens += this.llm.getNumTokens(doc.page_content);

			if (consumed_tokens < this.maxTokensLimit) {
				result.push(doc.page_content);
			}
		}

		return result.reverse().join('; ');
	}

    private scoreMemoryImportance(memory_content: string, weight: number = 0.15): number {
		const prompt = PromptTemplate.fromTemplate(
			`On the scale of 1 to 10, where 1 is purely mundane` +
				` (e.g., brushing teeth, making bed) and 10 is` +
				` extremely poignant (e.g., a break up, college` +
				` acceptance), rate the likely poignancy of the` +
				` following piece of memory. Respond with a single integer.` +
				`\nMemory: {memory_content}` +
				`\nRating: `
		);
		const chain = LLMChain({llm : this.llm, prompt});
		const score = chain.run({ memory_content: memory_content }).trim();
		const match = score.match(/^\D*(\d+)/);
		if (match) {
			return (parseFloat(match[1]) / 10) * weight;
		} else {
			return 0.0;
		}
	}

    private getTopicsOfReflection(last_k: number = 50): [string, string, string] {
		const prompt = PromptTemplate.fromTemplate(
			`{observations}\n\n` +
				`Given only the information above, what are the 3 most salient` +
				` high-level questions we can answer about the subjects in the statements?` +
				` Provide each question on a new line.\n\n`
		);
		const reflection_chain = LLMChain({llm : this.llm, prompt});
		const observations = this.memoryRetriever.memoryStream.slice(-last_k);
		const observation_str = observations.map(o => o.pageContent).join('\n');
		const result = reflection_chain.run({ observations: observation_str });
        const ress = parseList(result);
        return [ress[0], ress[1], ress[2]];
	}

    private getInsightsOnTopic(topic: string): string[] {
		const prompt = PromptTemplate.fromTemplate(
			`Statements about ${topic}\n` +
				`{related_statements}\n\n` +
				`What 5 high-level insights can you infer from the above statements?` +
				` (example format: insight (because of 1, 5, 3))`
		);
		const related_memories = this.fetchMemories(topic);
		const related_statements = related_memories
			.map((memory, i) => `${i + 1}. ${memory.page_content}`)
			.join('\n');
		const reflection_chain = LLMChain(
			{llm : this.llm, prompt}
		);
		const result = reflection_chain.run({ topic: topic, related_statements: related_statements });
		// TODO: Parse the connections between memories and insights
		return parseList(result);
	}

    private pauseToReflect(): string[] {
		const new_insights: string[] = [];
		const topics = this.getTopicsOfReflection();
		for (const topic of topics) {
			const insights = this.getInsightsOnTopic(topic);
			for (const insight of insights) {
				this.addMemory(insight);
			}
			new_insights.push(...insights);
		}
		return new_insights;
	}
    
    // TODO
    // * cache summary in supabase memory table
    generateRspn(observation: string, suffix: string): string {
		const prompt = PromptTemplate.fromTemplate(
			'{agent_summary_description}' +
				'\nIt is {current_time}.' +
				"\n{agent_name}'s status: {agent_status}" +
				"\nSummary of relevant context from {agent_name}'s memory:" +
				'\n{relevant_memories}' +
				'\nMost recent observations: {recent_observations}' +
				'\nObservation: {observation}' +
				'\n\n' +
				suffix
		);

		const agent_summary_description = this.getSummary();
		const relevant_memories_str = this.summarizeRelatedMemories(observation);
		const current_time_str = new Date().toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});

		let kwargs = {
			agent_summary_description,
			current_time: current_time_str,
			relevant_memories: relevant_memories_str,
			agent_name: this.name,
			observation,
			agent_status: this.status,
            recent_observations: ""
		};

		const consumed_tokens = this.llm.getNumTokens(
			prompt.format({...kwargs })
		);
		kwargs.recent_observations = this.getMemoriesUntilLimit(consumed_tokens);

		const action_prediction_chain = LLMChain({ llm: this.llm, prompt });
		const result = action_prediction_chain.run(kwargs);
		return result.trim();
	}

    addMemory(content: string): void {
        const importance_score = this.scoreMemoryImportance(content);
		this.memoryImportance += importance_score;
		const document = new Document({
			pageContent: content,
			metadata: { importance: importance_score }
		});
		const result = this.memoryRetriever.addDocuments([document]);

		if (
			this.memoryImportance > this.reflectionThreshold &&
			this.status !== 'Reflecting'
		) {
			const old_status = this.status;
			this.status = 'Reflecting';
			this.pauseToReflect();
			this.memoryImportance = 0.0;
			this.status = old_status;
		}

		return result;        
    }
}