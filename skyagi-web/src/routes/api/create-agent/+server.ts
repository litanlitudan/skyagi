import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		user_id,
		agent
	} = await request.json();

	const res = await locals.supabase
		.from('agent')
		.insert({
			user_id: user_id,
			name: agent.name,
		    age: agent.age,
			personality: agent.personality,
			initial_status: agent.status,
			initial_memory: agent.memory,
			avatar: agent.avatar
		});

	const { data } = await locals.supabase
		.from('agent')
		.select('id')
		.eq('user_id', user_id)
		.eq('age', agent.age)
		.eq('name', agent.name)
		.eq('personality', agent.personality)
		.eq('initial_status', agent.status)
		.eq('initial_memory', agent.memory);
	
	if (checkValidity(data)) {
		return new Response(JSON.stringify({ 'success': 1, agent_id: data[0].id }), { status: 200 });
	} else {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'failed to create new agent' }), { status: 200 });
	}
}) satisfies RequestHandler;
