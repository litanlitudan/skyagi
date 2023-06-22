import type { RequestHandler } from '../$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { checkValidity } from '$lib/utils';

// Can switch to the edge func if serverless is not necessary
export const config: Config = {
    runtime: 'nodejs18.x'
};

export const PUT = (async ({ request, locals }: { request: Request; locals: App.Locals }) => {
    const {
        email
    } = await request.json();

    const { error } = await locals.supabase.auth
        .signInWithOtp({
            email
        });

    if (!error) {
        return new Response(JSON.stringify({ 'success': 1 }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ 'success': 0, 'error': error.message }), { status: 200 });
    }
}) satisfies RequestHandler;
