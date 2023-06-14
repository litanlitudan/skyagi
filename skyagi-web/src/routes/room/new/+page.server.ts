import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { get_all_llms } from '$lib/model/model';

export const load = (async ({ fetch, locals }) => {
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }
    const user_id = session.user.id;

    const charactersResponse = await fetch("/api/get-agents", {
        method: 'PUT',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({ user_id })
    })

    const agentsData = await charactersResponse.json();

    let agents = [];
    if (agentsData.success) {
        // filter the archived agents
        agents = agentsData.agents.filter((agent: { archived: boolean; }) => !agent.archived);
    }

    const models = get_all_llms().map((model) => ({ name: model, value: model }));

    return {
        agents: agents,
        models: models,
        userId: user_id
    }
}) satisfies PageServerLoad;
