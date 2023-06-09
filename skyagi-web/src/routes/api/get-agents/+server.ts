import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';


// Can switch to the edge func if serverless is not necessary
export const config: Config = {
    runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const {
        user_id
    } = await request.json();

    const { data: agents } = await locals.supabase
        .from('agent')
        .select()
        .eq('user_id', user_id);

    if (checkValidity(agents) === false) {
        return new Response(JSON.stringify({ 'success': 0, 'error': 'agent not found' }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ 'success': 1, 'agents': agents }), { status: 200 });
    }
}) satisfies RequestHandler;
