import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';
import { TransactionStatus } from '$lib/types';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id,
		agent_id
	} = await request.json();

	// get memories
	const { data: agent_memories} = await locals.supabase
		.from('memory')
		.select('content')
        .or(`status.eq.${TransactionStatus.SUCCESS},status.is.null`)
		.contains('metadata', {'agent_id': agent_id})
		.contains('metadata', {'conversation_id': conversation_id});

	if (checkValidity(agent_memories) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'failed loading agent memories' }), { status: 200 });
	}

	let memories = "";
	for (const mem of agent_memories) {
		memories += (mem.content + "\n");
	}

	// get existing agent
	const { data: existing_agent } = await locals.supabase
		.from('agent')
		.select('user_id, name, age, personality, initial_status')
		.eq('id', agent_id);

	if (checkValidity(existing_agent) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
	}

	// update the memory	
	const { error } = await locals.supabase
		.from('agent')
		.update({
			user_id: existing_agent[0].user_id,
			name: existing_agent[0].name,
		    age: existing_agent[0].age,
			personality: existing_agent[0].personality,
			initial_status: existing_agent[0].initial_status,
			initial_memory: memories
		})
		.eq('id', agent_id);

	if (error) {
		return new Response(JSON.stringify({ 'success': 0, 'error': "failed to update agent initial memory" }), { status: 200 });
	} else {
		return new Response(JSON.stringify({ 'success': 1 }), { status: 200 });
	}

}) satisfies RequestHandler;
