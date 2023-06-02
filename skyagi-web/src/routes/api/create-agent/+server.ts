import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

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
			initial_memory: agent.memory
		});

	const { data } = await locals.supabase
		.from('agent')
		.select('id')
		.eq('user_id', user_id)
		.eq('age', agent.age)
		.contains('name', agent.name)
		.contains('personality', agent.personality)
		.contains('initial_status', agent.status)
		.contains('initial_memory', agent.memory);
	
	//return new Response(JSON.stringify({ message: res, agent_id: data[0].id }), { status: 200 });
	return new Response(JSON.stringify({ message: res, agent_id: data }), { status: 200 });
}) satisfies RequestHandler;
