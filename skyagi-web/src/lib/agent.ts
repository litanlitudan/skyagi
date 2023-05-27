import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";

export class GenerativeAgent {
    id: string;
    name: string;
	age: number;
	personality: string;
	status: string;
	llm: BaseLanguageModel;
	memoryRetriever: TimeWeightedVectorStoreRetriever;

	maxTokensLimit: number = 1200;

	reflection_threshold?: number;
	memory_importance: number = 0.0;

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
        
    }
}