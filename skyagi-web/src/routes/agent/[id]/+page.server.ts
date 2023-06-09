import type { AgentDataType } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


export const load = (async ({ params, fetch, locals }) => {
    const { id: agent_id } = params;
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }
    const user_id = session.user.id;

    const resp = await fetch('/api/get-agent', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ agent_id, user_id })
    });
    const data = await resp.json();

    if (!data.success) {
        return {
            body: {}
        }
    }

    const agent = data.data;
    const agentData: AgentDataType = {
        id: agent.id,
        name: agent.name,
        age: agent.age,
        personalities: agent.personality,
        socialStatus: agent.initial_status,
        memories: agent.initial_memory.split('\n'),
        archived: agent.archived
    };

    return {
        user: session.user,
        body: agentData
    }

}) satisfies PageServerLoad;
