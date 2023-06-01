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

// TODO:
// [Critical] should the order of score be desc or aesc
// [Func] support embeddings from different LLM models
// [Func] config llm based on the user's request
// [Performance] cache summary in supabase memory table

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
    the_other_agent_id: string;
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

    storage: any;

    async setup(supabase: any, conversationId: string, agentId: string, llm: any, the_other_agent_id: string): Promise<void> {
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
        this.llm = new ChatOpenAI();

        // create retriever
        const vectorStore = new SupabaseVectorStore(
            new OpenAIEmbeddings(),
            {
                client: this.storage,
                tableName: "memory",
                queryName: "match_memories"
            }
        );
        this.memoryRetriever =  vectorStore.asRetriever(15, {conversation_id: conversationId, agent_id: agentId});

        // get memories
        await this.getAgentMemories(conversationId, agentId);

        /*
        this.memoryRetriever = new TimeWeightedVectorStoreRetriever({
            vectorStore,
            otherScoreKeys: ["importance"],
            k: 15}
        );
        */
    }

    async getAgentMemories(conversationId: string, agentId: string): Promise<void> {

        const { data: allMemories } = await this.storage
            .from('memory')
		    .select('id, content, metadata')
		    .contains('metadata',{"conversation_id": conversationId})
		    .contains('metadata',{"agent_id": agentId})
            .order('metadata->create_time', { ascending: true });
        this.memories = allMemories;
        this.status = this.memories[this.memories.length - 1].metadata.cur_status;
    }

    private async updateMemoryAccessTime(mem: Document): Promise<void> {
        // get all metadata
        const content = mem.pageContent;
        const agent_id = mem.metadata.agent_id;
        const conv_id = mem.metadata.conversation_id;
        const create_time = mem.metadata.create_time;
        const importance = mem.metadata.importance;
        const cur_status = mem.metadata.cur_status;

        // update last_access_time
        const { error } = await this.storage
		    .from('memory')
            .update({metadata: {
                agent_id: agent_id,
                cur_status: cur_status,
                importance: importance,
                create_time: create_time, 
                conversation_id: conv_id,
                last_access_time: new Date().toISOString()
              }
            })
		    .contains('metadata', {'agent_id': agent_id})
		    .contains('metadata', {'conversation_id': conv_id})
		    .contains('metadata', {'create_time': create_time})
            .eq('content', content);
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
        
        // add conversation to the message table
        const messageEntry = {
            conversation_id: this.conv_id,
            agent_id: this.id,
            recipient_agent_id: this.the_other_agent_id,
            create_time:  new Date().toISOString(),
            content: result.text.trim() 
        }
        const { error } = await this.storage
            .from('message')
            .insert(messageEntry)

        if (error !== null) {
            return error;
        } else {
            return result.text.trim();
        }
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