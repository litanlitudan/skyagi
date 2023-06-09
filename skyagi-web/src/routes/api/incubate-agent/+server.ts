import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';


// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id,
		agent_id,
		new_agent_name
	} = await request.json();

	// get existing agent
	const { data: existing_agent } = await locals.supabase
		.from('agent')
		.select('user_id, name, age, personality, initial_status, avatar')
		.eq('id', agent_id);

	if (checkValidity(existing_agent) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
	}
	
	// get memories
	const { data: agent_memories } = await locals.supabase
		.from('memory')
		.select('content')
		.contains('metadata', {'agent_id': agent_id})
		.contains('metadata', {'conversation_id': conversation_id});

	if (checkValidity(agent_memories) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'failed loading agent memories' }), { status: 200 });
	}

	let memories = "";
	for (const mem of agent_memories) {
		memories += (mem.content + "\n");
	}
	
	const { error } = await locals.supabase
		.from('agent')
		.insert({
			user_id: existing_agent[0].user_id,
			name: new_agent_name,
		    age: existing_agent[0].age,
			personality: existing_agent[0].personality,
			initial_status: existing_agent[0].initial_status,
			initial_memory: memories,
			avatar: existing_agent[0].avatar
		});

	if (error) {
		return new Response(JSON.stringify({ 'success': 0, 'error': "failed to create new agent" }), { status: 200 });
	}

	const { data: new_agent } = await locals.supabase
		.from('agent')
		.select('id')
		.eq('user_id', existing_agent[0].user_id)
		.eq('name', new_agent_name)
		.eq('age', existing_agent[0].age)
		.eq('personality', existing_agent[0].personality)
		.eq('initial_status', existing_agent[0].initial_status)
		.eq('initial_memory', memories);

	if (checkValidity(new_agent) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': "failed to get new agent id" }), { status: 200 });
	} else {
		return new Response(JSON.stringify({ 'success': 1, agent_id: new_agent[0].id }), { status: 200 });
	}

}) satisfies RequestHandler;
