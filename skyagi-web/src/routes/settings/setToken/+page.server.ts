import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { get_all_llms } from '$lib/model/model';

export const load = (async ({ fetch, locals }) => {
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }

    const models = get_all_llms().map((model) => ({ name: model, value: model }));

    return {
        models: models
    }
}) satisfies PageServerLoad;
