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

	return new Response(JSON.stringify({ message: res }), { status: 200 });
}) satisfies RequestHandler;
