import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import type { BaseLanguageModel } from "langchain/base_language";
import { _ } from "$env/static/private";
import { load_llm_from_config, type LLMSettings, type EmbeddingSettings, load_embedding_from_config } from "./model/model";
import { TransactionStatus } from "./types";

// Future improvements:
// [Performance] cache summary in supabase memory table
// [Accuracy] prompt management

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
	embedding: number[];
    content: string;
    metadata: MemoryMetadata;
	updated: boolean;
}

export class GenerativeAgent {
    conv_id : string;
    id: string;
    the_other_agent_id: string;
    name: string;
	age: number;
	personality: string;
	status: string;
    memories: Memory[];
	llm: BaseLanguageModel;
	embeddings: any;
    memoryRetriever: TimeWeightedVectorStoreRetriever;
    storage: any;

	maxTokensLimit: number = 1200;
	reflectionThreshold: number = 8;
	memoryImportance: number = 0.0;

    async setup(supabase: any, conversationId: string, agentId: string, recipient_agent_model_settings: { llm: LLMSettings, embedding: EmbeddingSettings }, the_other_agent_id: string): Promise<void> {
        // get agent's profile
        this.storage = supabase;
        const { data: profiles } = await this.storage
            .from('agent')
            .select('name, age, personality')
            .eq('id', agentId);
        this.id = agentId;
        this.the_other_agent_id = the_other_agent_id;
        this.name = profiles[0].name;
        this.age = profiles[0].age;
        this.personality = profiles[0].personality;

        this.conv_id = conversationId;
        this.llm = load_llm_from_config(recipient_agent_model_settings.llm);

        await this.getAgentMemories(conversationId, agentId);

        // create retriever
        this.embeddings = load_embedding_from_config(recipient_agent_model_settings.embedding);
        // TODO: (kejiez) pass down embeddingSize to SQL query
        // TODO: (kejiez) support more embedding size
        const vectorStore = new MemoryVectorStore(
            this.embeddings
        );

		let documents =	this.memories.map((mem, i) => new Document({
				pageContent: mem.content,
				// This is the hack to create a ephemeral TWretriever with time history 
				metadata: {
					...mem.metadata,
					created_at: mem.metadata.create_time,
					last_accessed_at: mem.metadata.last_access_time,
					buffer_idx: i
				}
			}));

		await vectorStore.addVectors(this.memories.map(m => m.embedding), documents);

		this.memoryRetriever = new TimeWeightedVectorStoreRetriever({
			vectorStore,
			searchKwargs: 15,
			k: 1,
			decayRate: 1,
			memoryStream: documents,
			otherScoreKeys: ["importance"]
		});
    }

    async getAgentMemories(conversationId: string, agentId: string): Promise<void> {

        const { data: allMemories } = await this.storage
            .from('memory')
		    .select('id, content, embedding, metadata')
            .or(`status.eq.${TransactionStatus.SUCCESS},status.is.null`)
		    .contains('metadata',{"conversation_id": conversationId})
		    .contains('metadata',{"agent_id": agentId})
            .order('metadata->create_time', { ascending: true });
        this.memories = allMemories;
		for (const m of this.memories) {
			m.updated = false;
		}
		if (this.memories.length !== 0) {
			this.status = this.memories[this.memories.length - 1].metadata.cur_status;
		} else {
			this.status = "";	
		}
    }

    private async updateMemoryAccessTime(mem: Document): Promise<void> {
        // get all metadata
        const content = mem.pageContent;
        const create_time = mem.metadata.create_time;
		
        // update last_access_time
		for (const mem of this.memories) {
			if (mem.content === content && mem.metadata.create_time === create_time) {
				mem.metadata.last_access_time = new Date().toISOString();	
				mem.updated = true;
				break;
			}
		}
    }

    private async fetchMemories(observation: string): Promise<Document[]> {
		const mems = await this.memoryRetriever.getRelevantDocuments(observation);
		for (const mem of mems) {
            await this.updateMemoryAccessTime(mem)
        }
        return mems;
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
		return parseList(result);
	}

    private async addNewMemLocal(content: string): Promise<void> {
        const importanceScore = await this.scoreMemoryImportance(content);
		this.memoryImportance += importanceScore;
        const nowTime = new Date().toISOString();
        const embedding = await this.embeddings.embedQuery(content);

        const new_mem: Memory = {
			id: "",
            content: content,
			embedding: embedding,
            metadata: {
                conversation_id: this.conv_id,
                agent_id: this.id,
                create_time: nowTime,
                last_access_time: nowTime,
                cur_status: this.status,
                importance: importanceScore
            },
			updated: true
        }
		
        this.memories.push(new_mem);
    }

    private async pauseToReflect(): Promise<string[]> {
		const newInsights: string[] = [];
		const topics = await this.getTopicsOfReflection();
		for (const topic of topics) {
			const insights = await this.getInsightsOnTopic(topic);
			for (const insight of insights) {
				this.addNewMemLocal(insight);
			}
			newInsights.push(...insights);
		}
		return newInsights;
	}
    
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

		const consumedTokens = await this.llm.getNumTokens(
            await prompt.format({...kwargs })
		);
		kwargs.recentObservations = await this.getMemoriesUntilLimit(consumedTokens);

		const actionPredictionChain = new LLMChain({ llm: this.llm, prompt });
		const result = await actionPredictionChain.call(kwargs);

        return result.text.trim();
	}

    async addMemory(content: string): Promise<void> {
		this.addNewMemLocal(content);
		
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

		// sync with storage
		for (const mem of this.memories) {
			if (mem.id === "") {
			    // new memory
				const mem_to_add = {
					content: mem.content,
			        embedding: mem.embedding,
					metadata: mem.metadata
				}
				const { data: new_mem_id, error } = await this.storage
				    .from('memory')
			        .insert(mem_to_add)
			        .select('id');
			} else if (mem.updated === true) {
				// update existing memory
				const { error } = await this.storage
				    .from('memory')
					.update({
						metadata: mem.metadata
					})
					.eq('id', mem.id);
			}
		}
    }

    async addMessage(message: string, response: string): Promise<string> {
		// add the incoming message to the message table
        const incomingMessageEntry = {
            conversation_id: this.conv_id,
            agent_id: this.the_other_agent_id,
            recipient_agent_id: this.id,
            create_time:  new Date().toISOString(),
            content: message 
        }

        const { error: error1 } = await this.storage
            .from('message')
            .insert(incomingMessageEntry)

        if (error1 !== null) {
            return error1;
        }
        
        // add the response message to the message table
        const responseMessageEntry = {
            conversation_id: this.conv_id,
            agent_id: this.id,
            recipient_agent_id: this.the_other_agent_id,
            create_time:  new Date().toISOString(),
            content: response 
        }

        const { error: error2 } = await this.storage
            .from('message')
            .insert(responseMessageEntry)

        if (error2 !== null) {
            return error2;
        }

        return '';
	}

}