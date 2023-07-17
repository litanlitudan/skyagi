import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { get_all_embeddings_data, get_all_llms_data } from '$lib/model/model';

export const load = (async ({ params, fetch, locals }) => {
    const { id: conversation_id } = params;
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }
    const user_id = session.user.id;
    console.log(conversation_id)
    const resp = await fetch('/api/get-conversation', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ conversation_id })
    });
    const data = await resp.json();
    if (!data.success) {
        return {
            body: {}
        }
    }

    const chatName = data.data.name
    console.log(chatName)
    const agentIds = data.data.agent_ids
    const userAgentIds = data.data.user_agent_ids
    const messages = data.data.messages

    const agentIdToAgentData = async (agent_id) => {
        let agentResponse = await fetch('/api/get-agent', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            body: JSON.stringify({ user_id, agent_id })
        })
        let agentData = await agentResponse.json()
        return agentData.agent
    }
    let rstLs = await Promise.all(agentIds.map((item)=>(agentIdToAgentData(item))))
    let userAgentNames = []
    for (let i=0; i<userAgentIds.length; i++){
        for (let j=0; j<agentIds.length; j++){
            if (userAgentIds[i] == agentIds[j]){
                userAgentNames.push(rstLs[j].name)
                continue
            }
        }
        
    }

    const models = get_all_llms_data().map((model) => ({ name: model.name, value: model.name, data: model }));
    const embeddings = get_all_embeddings_data()

    return {
        conversation_id: conversation_id,
        user: session.user,
        userId: user_id,
        agentData: rstLs,
        agentIds: agentIds,
        chatName: chatName,
        userAgentIds: userAgentIds,
        userAgentNames: userAgentNames,
        models: models,
        messages: messages,
        embeddings: embeddings
    }

}) satisfies PageServerLoad;
