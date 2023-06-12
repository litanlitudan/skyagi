import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { get_all_llms } from '$lib/model/model';

export const load = (async ({ params, fetch, locals }) => {
    const { id: conversation_id } = params;
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }
    const user_id = session.user.id;

    const resp = await fetch('/api/get-conversation', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ conversation_id })
    });
    const data = await resp.json();
    if (!data.summary) {
        return {
            body: {}
        }
    }

    const chatName = data.name
    const agentIds = data.agent_ids
    const userAgentIds = data.user_agent_ids

    const agentIdToAgentData = async (agent_id) => {
        let agentResponse = await fetch('/api/get-agent', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            body: JSON.stringify({ user_id, agent_id })
        })
        let agentData = await agentResponse.json()
        console.log(agentData)
        return agentData.data
    }
    let rstLs = Promise.all(agentIds.map((item)=>(agentIdToAgentData(item))))


    const models = get_all_llms().map((model) => ({ name: model, value: model }));
    return {
        conversation_id: conversation_id,
        user: session.user,
        agentData: rstLs,
        agentIds: agentIds,
        chatName: chatName,
        userAgentIds: userAgentIds,
        models: models
    }

}) satisfies PageServerLoad;
