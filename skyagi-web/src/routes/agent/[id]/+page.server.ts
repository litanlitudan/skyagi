import type { AgentDataType } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load = (async ({ params, fetch }) => {
    const { id: agent_id } = params;
    // TODO: get user_id
    const user_id = "";

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
        memories: [agent.initial_memory],
        archived: agent.archived
    };

    return {
        body: agentData
    }

}) satisfies PageServerLoad;
