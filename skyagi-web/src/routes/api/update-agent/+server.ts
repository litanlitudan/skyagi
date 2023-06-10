import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
    runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const { agent_id, user_id, agent } = await request.json();

    const { error } = await locals.supabase.from('agent')
        .update({
            name: agent.name,
            age: agent.age,
            personality: agent.personality,
            initial_status: agent.status,
            initial_memory: agent.memory,
            avatar: agent.avatar
        })
        .match({
            id: agent_id,
            user_id: user_id
        });

    if (error) {
        console.error(`Fail to update agent: ${error?.message}`);
        return new Response(JSON.stringify({ 'success': 0, 'error': "failed to update agent" }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ 'success': 1 }), { status: 200 });
    }
}) satisfies RequestHandler;
