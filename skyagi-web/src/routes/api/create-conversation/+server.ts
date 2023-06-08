import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { checkValidity } from '$lib/utils';


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
	const res = await locals.supabase
		.from('conversation')
		.insert({
			user_id: user_id,
			name: name,
			agents: agent_ids,
			user_agents: user_agent_ids
		});

	// assumption: (user_id, name) combo is unique
	const { data: conv_id } = await locals.supabase
		.from('conversation')
		.select('id')
		.eq('user_id', user_id)
		.eq('name', name);

	if (checkValidity(conv_id) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to find conversation' }), { status: 200 });
	}
	
	// get agents' initial memory and add to memory
	// TODO
	// use per agent model based embedding
	const embeddings = new OpenAIEmbeddings();
	const currentTime = new Date().toISOString();

	for (const agent_id of agent_ids) {
		const { data: agent_info } = await locals.supabase
			.from('agent')
			.select('initial_status, initial_memory')
			.eq('id', agent_id);

	    if (checkValidity(agent_info) === false) {
		    return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
	    }

		const embedding = await embeddings.embedQuery(agent_info[0].initial_memory);
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
