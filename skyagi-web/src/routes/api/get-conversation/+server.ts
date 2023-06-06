import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';


// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
	const {
		conversation_id
	} = await request.json();
	
	// get the conversation
	const { data: conversation } = await locals.supabase
		.from('conversation')
		.select('name, agents, user_agents')
		.eq('id', conversation_id);

	if (checkValidity(conversation) === false) {
		return new Response(JSON.stringify({ 'success': 0, 'error': 'conversation not found' }), { status: 200 });
	}
	
	// get messages of a conversation
	const { data: messages } = await locals.supabase
		.from('message')
		.select('agent_id, recipient_agent_id, create_time, content')
		.eq('conversation_id', conversation_id)
        .order('create_time', { ascending: true });

	// a converation could have empty messages, so no need to check if messages is empty

    let resp = {
        'summary': 1,
        'name': conversation[0].name,
        'agent_ids': conversation[0].agents,
        'user_agent_ids': conversation[0].user_agents,
        'messages': messages
    };
	
	return new Response(JSON.stringify(resp), { status: 200 });
}) satisfies RequestHandler;
