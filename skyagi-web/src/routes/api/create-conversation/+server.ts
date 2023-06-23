import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';
import { type EmbeddingSettings, load_embedding_from_config } from '$lib/model/model';
import { TransactionStatus } from '$lib/types';


// Can switch to the edge func if serverless is not necessary
export const config: Config = {
    runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const {
        name,
        user_id,
        agents,
        user_agent_ids
    } = await request.json();

    // get agents' initial memory and add to memory
    const initialMemoryEmbeddings: number[][] = [];
    const agentInfos: any[] = [];

    for (const agent of agents) {
        const agent_id = agent.id;
        const embedding_model_settings = agent.embedding_model_settings;

        const { data: agent_info, error } = await locals.supabase
            .from('agent')
            .select('initial_status, initial_memory')
            .eq('id', agent_id);

        if (error || (checkValidity(agent_info) === false)) {
            return new Response(JSON.stringify({ 'success': 0, 'error': `agent not found, id: ${agent_id}` }), { status: 200 });
        }
        agentInfos.push(agent_info);

        // load embedding model
        const embeddings = load_embedding_from_config(embedding_model_settings as EmbeddingSettings);

        let embedding;
        try {
            embedding = await embeddings.embedQuery(agent_info[0].initial_memory);
        } catch (error: any) {
            console.error(error.message);
            return new Response(JSON.stringify({ 'success': 0, 'error': `failed to query embedding for agent: ${agent_id}` }), { status: 200 });
        }

        initialMemoryEmbeddings.push(embedding);
    }

    const currentTime = new Date().toISOString();
    // DB call: Create conversation
    const { data: conv_id, error } = await locals.supabase
        .from('conversation')
        .insert({
            user_id: user_id,
            name: name,
            agents: agents.map((agent: { id: string; }) => agent.id),
            user_agents: user_agent_ids,
            status: TransactionStatus.PENDING,
            createdAt: currentTime
        })
        .select('id');

    if (error || (checkValidity(conv_id) === false)) {
        return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to create conversation' }), { status: 200 });
    }

    // DB call: create Memory for all agents
    const createdMemoryIds: string[] = [];
    for (let i = 0; i < agents.length; ++i) {
        const agent_id = agents[i].id;
        const importance = 0.0;
        const metadata = {
            agent_id: agent_id,
            cur_status: agentInfos[i][0].initial_status,
            importance: importance,
            create_time: currentTime,
            conversation_id: conv_id[0].id,
            last_access_time: currentTime
        };

        const { data: memory_id, error } = await locals.supabase
            .from('memory')
            .insert({
                content: agentInfos[i][0].initial_memory,
                embedding: initialMemoryEmbeddings[i],
                metadata: metadata,
                status: TransactionStatus.PENDING,
                createdAt: currentTime
            })
            .select('id');

        if (error || (checkValidity(memory_id) === false)) {
            // run compensation transactions
            // 1. delete inserted conversation
            const { error } = await locals.supabase
                .from('conversation')
                .delete()
                .eq('id', conv_id[0].id);
            if (error) {
                // compensation transaction failed, we need to record and retry it again.
                console.error(`Fail to run compensation transaction to delete conversation ${conv_id[0].id}, error: ${error.message}`);
            }

            // 2. delete inserted memories
            for (let j = 0; j < i; ++j) {
                const { error } = await locals.supabase
                    .from('memory')
                    .delete()
                    .eq('id', createdMemoryIds[j]);
                if (error) {
                    // compensation transaction failed, we need to record and retry it again.
                    console.error(`Fail to run compensation transaction to delete memory ${createdMemoryIds[j]}, error: ${error.message}`);
                }
            }

            // error out
            return new Response(JSON.stringify({ 'success': 0, 'error': `failed to create new initial memory for agent ${agent_id}` }), { status: 200 });
        }

        createdMemoryIds.push(memory_id[0].id);
    }


    // commit the conversation and memory creation by updating the status to SUCCESS
    const { error: updateConversationError } = await locals.supabase
        .from('conversation')
        .update({
            status: TransactionStatus.SUCCESS
        })
        .eq('id', conv_id[0].id);

    if (updateConversationError) {
        // commit transaction failed, we need to record and retry it again.
        console.error(`Fail to update status to SUCCESS for conversation: ${conv_id[0].id}, error: ${updateConversationError.message}`);
    }

    for (const memory_id of createdMemoryIds) {
        const { error } = await locals.supabase
            .from('memory')
            .update({
                status: TransactionStatus.SUCCESS
            })
            .eq('id', memory_id);

        if (error) {
            // commit transaction failed, we need to record and retry it again.
            console.error(`Fail to update status to SUCCESS for memory: ${memory_id}, error: ${error.message}`);
        }
    }

    return new Response(JSON.stringify({ success: 1, conversation_id: conv_id[0].id }), { status: 200 });
}) satisfies RequestHandler;
