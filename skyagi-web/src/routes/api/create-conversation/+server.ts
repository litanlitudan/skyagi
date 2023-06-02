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
		user_agents
	} = await request.json();

	// create conversation
	const res = await locals.supabase
		.from('conversation')
		.insert({
			user_id: user_id,
			name: name,
			agents: agents,
			user_agents: user_agents
		});

	// assumption: (user_id, name) combo is unique
	const { data: conv_id } = await locals.supabase
		.from('conversation')
		.select('id')
		.eq('user_id', user_id)
		.eq('name', name);

	if (checkValidity(conv_id) === false) {
		return new Response(JSON.stringify({ 'success': 0 }), { status: 200 });
	}
	
	// get agents' initial memory and add to memory
    const embeddings = new OpenAIEmbeddings();
	const currentTime = new Date().toISOString();

	for (const agent of agents) {
		const agent_info = await locals.supabase
			.from('agent')
			.select('initial_status, initial_memory')
			.eq('id', agent);
		return new Response(JSON.stringify({ 'success': 1, res: agent_info }), { status: 200 });

	    if (checkValidity(agent_info) === false) {
		    return new Response(JSON.stringify({ 'success': 0 }), { status: 200 });
	    }

		const embedding = await embeddings.embedQuery(agent_info[0].initial_memory);
		const importance = 0.0;
		const metadata = {
			agent_id: agent,
			cur_status: agent_info[0].initial_status,
			importance: importance,
			create_time: currentTime,
			conversation_id: conv_id[0].id,
			last_access_time: currentTime
		};

		await locals.supabase
			.from('memory')
			.insert({
				content: agent_info[0].initial_memory,
				embedding: embedding,
				metadata: metadata
			});
	}

	// need to call add_memory?
	return new Response(JSON.stringify({ success: 1, conversation_id: conv_id[0].id }), { status: 200 });
}) satisfies RequestHandler;
