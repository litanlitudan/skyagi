import { TimeWeightedVectorStoreRetriever } from "langchain/retrievers/time_weighted";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import {BaseLanguageModel} from "langchain/base_language";

export class GenerativeAgent {
    id: string;
    name: string;
	age: number;
	personality: string;
	status: string;
	llm: BaseLanguageModel;
	memory_retriever: TimeWeightedVectorStoreRetriever;

	reflection_threshold?: number;
	summary: string = '';
	summary_refresh_seconds: number = 3600;
	last_refreshed: Date = new Date();
	daily_summaries: string[] = [];
	memory_importance: number = 0.0;
	max_tokens_limit: number = 1200;

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
        this.memory_retriever = new TimeWeightedVectorStoreRetriever({
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
            this.memory_retriever.addDocuments(memory.content);
        }
    }
}