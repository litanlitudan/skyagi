import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id,
		initiate_agent,
		initiate_agent_model,
		recipient_agent,
		recipient_agent_model,
		message
	} = await request.json();
	return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
}) satisfies RequestHandler;
