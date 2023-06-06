import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';

// TODO
// add conversation summary

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
	runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const {
        user_id
    } = await request.json();
    
    // get the conversations
    const { data: conversations } = await locals.supabase
        .from('conversation')
        .select('id, name, agents, user_agents')
        .eq('user_id', user_id);
        
    if (checkValidity(conversations) === false) {
        return new Response(JSON.stringify({ 'success': 0, 'error': 'conversations not found' }), { status: 200 });
    }
    
    let res_conversations = [];
    // get snapshot of a conversation
    // Some conversations are created, but no message exchanged
    for (const conversation of conversations) {
        let snapshot = [];
        const { data: messages } = await locals.supabase
            .from('message')
            .select('agent_id, recipient_agent_id, create_time, content')
            .eq('conversation_id', conversation.id)
            .order('create_time', { ascending: false })
            .limit(3);

        for (const m of messages) {
            snapshot.push({
                'initiate_agent_id': m.agent_id,
                'recipient_agent_id': m.recipient_agent_id,
                'create_time': m.create_time,
                'content': m.content
            });
        }
        
        res_conversations.push({
            'id': conversation.id,
            'name': conversation.name,
            'summary': '',
            'agents': conversation.agents,
            'user_agents': conversation.user_agents,
            'snapshot': snapshot
        })
    }
    let resp = {
        'summary': 1,
        'conversations': res_conversations
    };
	
	return new Response(JSON.stringify(resp), { status: 200 });
}) satisfies RequestHandler;
