import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
    runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const { agent_id, user_id } = await request.json();

    const { data: agent, error } = await locals.supabase.from('agent')
        .select('id, name, age, personality, initial_status, initial_memory, avatar')
        .match({
            id: agent_id,
            user_id: user_id
        })
        .limit(1)
        .single();

    if (checkValidity(agent)) {
        return new Response(JSON.stringify({ 'success': 1, data: agent }), { status: 200 });
    } else {
        console.error(`Fail to find agent: ${error?.message}`);
        return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
    }
}) satisfies RequestHandler;
