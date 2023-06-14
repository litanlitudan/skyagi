import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';
import { type EmbeddingSettings, load_embedding_from_config } from '$lib/model/model';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";


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

    let agent_ids = agents.map(agent => agent.id);

    // create conversation
    const { data: conv_id } = await locals.supabase
        .from('conversation')
        .insert({
            user_id: user_id,
            name: name,
            agents: agent_ids,
            user_agents: user_agent_ids
        })
        .select('id');

    if (checkValidity(conv_id) === false) {
        return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to find conversation' }), { status: 200 });
    }

    // get agents' initial memory and add to memory
    const currentTime = new Date().toISOString();

    for (const agent of agents) {
        const agent_id = agent.id;
        const embedding_model_settings = agent.embedding_model_settings;

        const { data: agent_info } = await locals.supabase
            .from('agent')
            .select('initial_status, initial_memory')
            .eq('id', agent_id);

        if (checkValidity(agent_info) === false) {
            return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
        }

        // load embedding model
        //const embeddings = load_embedding_from_config(embedding_model_settings as EmbeddingSettings);
        const embeddings = new OpenAIEmbeddings();

        let embedding;
        try {
            embedding = await embeddings.embedQuery(agent_info[0].initial_memory);
        } catch (error) {
            console.error(error.message);
            return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to query embedding' }), { status: 200 });
        }
        return new Response(JSON.stringify({ success: 1, conversation_id: embedding }), { status: 200 });

        const importance = 0.0;
        const metadata = {
            agent_id: agent_id,
            cur_status: agent_info[0].initial_status,
            importance: importance,
            create_time: currentTime,
            conversation_id: conv_id[0].id,
            last_access_time: currentTime
        };

        const { error } = await locals.supabase
            .from('memory')
            .insert({
                content: agent_info[0].initial_memory,
                embedding: embedding,
                metadata: metadata
            });

        if (error) {
            return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to create new initial memory' }), { status: 200 });
        }
    }

    return new Response(JSON.stringify({ success: 1, conversation_id: conv_id[0].id }), { status: 200 });
}) satisfies RequestHandler;
