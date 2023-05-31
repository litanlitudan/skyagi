import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import type { VectorStoreRetriever } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { ChatOpenAI } from "langchain/chat_models/openai";
import type { BaseLanguageModel } from "langchain/base_language";
import { _ } from "$env/static/private";

function parseList(text: string): string[] {
	const lines = text.trim().split('\n');
	return lines.map(line => line.replace(/^\s*\d+\.\s*/, '').trim());
}

interface MemoryMetadata {
  conversation_id: string;
  agent_id: string;
  create_time: string;
  last_access_time: string;
  cur_status: string;
  importance: number;
}

interface Memory {
    id: string;
    content: string;
    metadata: MemoryMetadata;
}

export class GenerativeAgent {
    conv_id : string;
    id: string;
    name: string;
	age: number;
	personality: string;
	status: string;
    memories: Memory[];
	llm: BaseLanguageModel;
    memoryRetriever: VectorStoreRetriever;
	//memoryRetriever: TimeWeightedVectorStoreRetriever;

	maxTokensLimit: number = 1200;
	reflectionThreshold: number = 8;
	memoryImportance: number = 0.0;

    // TODO:
    // * support embeddings from different LLM models
    // * standardize sql query later
    // * config llm based on the user's request
    async setup(supabase: any, conversationId: string, agentId: string, llm: any): Promise<void> {
        // get agent's profile
        const { data: profiles } = await supabase
            .from('agent')
		    .select('name, age, personality')
		    .eq('id', agentId);
        this.id = agentId;
        this.name = profiles[0].name;
        this.age = profiles[0].age;
        this.personality = profiles[0].personality;

        this.conv_id = conversationId;
        this.llm = new ChatOpenAI();

        // create retriever
        const vectorStore = new SupabaseVectorStore(
            new OpenAIEmbeddings(),
            {
                client: supabase,
                tableName: "memory",
                queryName: "match_memories"
            }
        );
        this.memoryRetriever =  vectorStore.asRetriever(15, {conversation_id: conversationId, agent_id: agentId});

        // get memories
        await this.getAgentMemories(supabase, conversationId, agentId);

        /*
        this.memoryRetriever = new TimeWeightedVectorStoreRetriever({
            vectorStore,
            otherScoreKeys: ["importance"],
            k: 15}
        );
        */

        /*
        // Do I need to add all memories to retriever? -> don't think so
        for (const memory of allMemories) {
            const doc = new Document({
                pageContent: memory.content,
                metadata: { importance: importanceScore }
            });

            this.memoryRetriever.addDocuments([doc]);
        }
        */
    }

    async getAgentMemories(supabase: any, conversationId: string, agentId: string): Promise<void> {

        const { data: allMemories } = await supabase
            .from('memory')
		    .select('id, content, metadata')
		    .contains('metadata',{"conversation_id": conversationId})
		    .contains('metadata',{"agent_id": agentId})
            .order('metadata->create_time', { ascending: true });
        this.memories = allMemories;
        this.status = this.memories[this.memories.length - 1].metadata.cur_status;
    }

    async testadddoc(): Promise<void> {
        const nowTime = new Date().toISOString();
		const document = new Document({
			pageContent: "hello world",
			metadata: { 
                conversation_id: this.conv_id,
                agent_id: this.id,
                create_time: nowTime, 
                last_access_time: nowTime,
                cur_status: this.status,
                importance: 10
            }
		});
        await this.memoryRetriever.addDocuments([document]);
    }

    async testgetrelevant(): Promise<any> {
        const observation = "hello world";
		return await this.memoryRetriever.getRelevantDocuments(observation);
    }

    private async fetchMemories(observation: string): Promise<Document[]> {
		return await this.memoryRetriever.getRelevantDocuments(observation);
        // TODO: need to update the relevant doc last_access_time
	}

	private async computeAgentSummary(): Promise<string> {
		const prompt = PromptTemplate.fromTemplate(
			`How would you summarize ${this.name}'s core characteristics given the` +
				` following statements:\n` +
				`{related_memories}` +
				`Do not embellish.` +
				`\n\nSummary: `
		);
		const relevantMemories = await this.fetchMemories(`${this.name}'s core characteristics`);
		const relevantMemoriesStr = relevantMemories.map(mem => mem.pageContent).join('\n');
		const chain = new LLMChain({llm: this.llm, prompt});
		const res = await chain.run({ name: this.name, relatedMemories: relevantMemoriesStr });
        return res.trim();
	}

    private async getEntityFromObservation(observation: string): Promise<string> {
		const prompt = PromptTemplate.fromTemplate(
			`What is the observed entity in the following observation? ${observation}` + `\nEntity=`
		);
		const chain = new LLMChain({llm: this.llm, prompt});
		const res = await chain.run({ observation: observation });
        return res.trim();
	}

    private async getEntityAction(observation: string, entityName: string): Promise<string> {
		const prompt = PromptTemplate.fromTemplate(
			`What is the {entity} doing in the following observation? ${observation}` +
				`\nThe {entity} is`
		);
		const chain = new LLMChain({llm: this.llm, prompt});
		const res = await chain.run({ entity: entityName, observation: observation });
        return res.trim();
	}

    private formatMemoriesToSummarize(relevantMemories: Document[]): string {
		const contentStrs = new Set<string>();
		const content: string[] = [];

		for (const mem of relevantMemories) {
			if (contentStrs.has(mem.pageContent)) {

				continue;
			}

			contentStrs.add(mem.pageContent);
			const createdTime = mem.metadata.create_time.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true
			});

			content.push(`- ${createdTime}: ${mem.pageContent.trim()}`);
		}

		return content.join('\n');
	}

    // TODO
    // * cache summary in supabase memory table
	private async getSummary(forceRefresh: boolean = false): Promise<string> {
		let summary = await this.computeAgentSummary();

		return (
			`Name: ${this.name} (age: ${this.age})` +
			`\nInnate traits: ${this.personality}` +
			`\n${summary}`
		);
	}

    private async summarizeRelatedMemories(observation: string): Promise<string> {
		const entityName = await this.getEntityFromObservation(observation);
		const entityAction = await this.getEntityAction(observation, entityName);
		const q1 = `What is the relationship between ${this.name} and ${entityName}`;
		let relevantMemories = await this.fetchMemories(q1);
		const q2 = `${entityName} is ${entityAction}`;
        let relevantMemories2 = await this.fetchMemories(q2);
		relevantMemories.concat(relevantMemories2);

		const contextStr = this.formatMemoriesToSummarize(relevantMemories);
		const prompt = PromptTemplate.fromTemplate(
			`${q1}?\nContext from memory:\n${contextStr}\nRelevant context: `
		);

		const chain = new LLMChain({llm: this.llm, prompt});
        const res = await chain.run({ q1: q1, contextStr: contextStr.trim() });
        return res.trim();
	}

    private async getMemoriesUntilLimit(consumedTokens: number): Promise<string> {
		const result: string[] = [];

        // Todo: figure out how to work around memoryStream retrieval
		for (const doc of this.memories.slice().reverse()) {
			if (consumedTokens >= this.maxTokensLimit) {
				break;
			}
            
            const ntokens = await this.llm.getNumTokens(doc.content);
            consumedTokens += ntokens;

			if (consumedTokens < this.maxTokensLimit) {
				result.push(doc.content);
			}
		}

		return result.reverse().join('; ');
	}

    private async scoreMemoryImportance(memoryContent: string, weight: number = 0.15): Promise<number> {
		const prompt = PromptTemplate.fromTemplate(
			`On the scale of 1 to 10, where 1 is purely mundane` +
				` (e.g., brushing teeth, making bed) and 10 is` +
				` extremely poignant (e.g., a break up, college` +
				` acceptance), rate the likely poignancy of the` +
				` following piece of memory. Respond with a single integer.` +
				`\nMemory: {memoryContent}` +
				`\nRating: `
		);
		const chain = new LLMChain({llm : this.llm, prompt});
        const res = await chain.run({ memoryContent: memoryContent }); 
		const score = res.trim();
		const match = score.match(/^\D*(\d+)/);
		if (match) {
			return (parseFloat(match[1]) / 10) * weight;
		} else {
			return 0.0;
		}
	}

    private async getTopicsOfReflection(lastK: number = 50): Promise<[string, string, string]> {
		const prompt = PromptTemplate.fromTemplate(
			`{observations}\n\n` +
				`Given only the information above, what are the 3 most salient` +
				` high-level questions we can answer about the subjects in the statements?` +
				` Provide each question on a new line.\n\n`
		);
		const reflectionChain = new LLMChain({llm : this.llm, prompt});
		const observations = this.memories.slice(-lastK);
		const observationStr = observations.map(o => o.content).join('\n');
		const result = await reflectionChain.run({ observations: observationStr });
        const ress = parseList(result);
        return [ress[0], ress[1], ress[2]];
	}

    private async getInsightsOnTopic(topic: string): Promise<string[]> {
		const prompt = PromptTemplate.fromTemplate(
			`Statements about ${topic}\n` +
				`{relatedStatements}\n\n` +
				`What 5 high-level insights can you infer from the above statements?` +
				` (example format: insight (because of 1, 5, 3))`
		);
		const relatedMemories = await this.fetchMemories(topic);
		const relatedStatements = relatedMemories
			.map((memory, i) => `${i + 1}. ${memory.pageContent}`)
			.join('\n');
		const reflectionChain = new LLMChain(
			{llm : this.llm, prompt}
		);
		const result = await reflectionChain.run({ topic: topic, relatedStatements: relatedStatements });
		// TODO: Parse the connections between memories and insights
		return parseList(result);
	}

    private async pauseToReflect(): Promise<string[]> {
		const newInsights: string[] = [];
		const topics = await this.getTopicsOfReflection();
		for (const topic of topics) {
			const insights = await this.getInsightsOnTopic(topic);
			for (const insight of insights) {
				this.addMemory(insight);
			}
			newInsights.push(...insights);
		}
		return newInsights;
	}
    
    // TODO
    // * cache summary in supabase memory table
    // * add conversation to table message
    async generateRspn(observation: string, suffix: string): Promise<string> {
		const prompt = PromptTemplate.fromTemplate(
			'{agentSummaryDescription}' +
				'\nIt is {currentTime}.' +
				"\n{agentName}'s status: {agentStatus}" +
				"\nSummary of relevant context from {agentName}'s memory:" +
				'\n{relevantMemories}' +
				'\nMost recent observations: {recentObservations}' +
				'\nObservation: {observation}' +
				'\n\n' +
				suffix
		);

		const agentSummaryDescription = await this.getSummary();
		const relevantMemoriesStr = await this.summarizeRelatedMemories(observation);
		const currentTimeStr = new Date().toLocaleString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		});

		let kwargs = {
			agentSummaryDescription,
			currentTime: currentTimeStr,
			relevantMemories: relevantMemoriesStr,
			agentName: this.name,
			observation,
			agentStatus: this.status,
            recentObservations: ""
		};

        /*
		const consumedTokens = await this.llm.getNumTokens(
			prompt.format({...kwargs })
		);
        */
        const consumedTokens = 500;
		kwargs.recentObservations = await this.getMemoriesUntilLimit(consumedTokens);

		const actionPredictionChain = new LLMChain({ llm: this.llm, prompt });
		const result = await actionPredictionChain.run(kwargs);
		return result.trim();
	}

    async addMemory(content: string): Promise<void> {
        const importanceScore = await this.scoreMemoryImportance(content);
		this.memoryImportance += importanceScore;
        const nowTime = new Date().toISOString();
		const document = new Document({
			pageContent: content,
			metadata: { 
                conversation_id: this.conv_id,
                agent_id: this.id,
                create_time: nowTime, 
                last_access_time: nowTime,
                cur_status: this.status,
                importance: importanceScore
            }
		});
		await this.memoryRetriever.addDocuments([document]);
        const new_mem: Memory = {
            id: "",
            content: content,
            metadata: {
                conversation_id: this.conv_id,
                agent_id: this.id,
                create_time: nowTime,
                last_access_time: nowTime,
                cur_status: this.status,
                importance: importanceScore
            }
        }
        this.memories.push(new_mem);
		if (
			this.memoryImportance > this.reflectionThreshold &&
			this.status !== 'Reflecting'
		) {
			const oldStatus = this.status;
			this.status = 'Reflecting';
			await this.pauseToReflect();
			this.memoryImportance = 0.0;
			this.status = oldStatus;
		}
    }
}