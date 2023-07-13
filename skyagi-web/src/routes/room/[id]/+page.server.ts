import type { AgentDataType, ConversationDataType, MessageDataType } from '$lib/types';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const getConversationMessages = (messages: any[]): MessageDataType[] => messages.map(message => ({
    initiateAgentId: message.agent_id,
    recipientAgentId: message.recipient_agent_id,
    createTime: message.create_time,
    content: message.content,
}));

export const load = (async ({ params, fetch, locals }) => {
    const { id: conversation_id } = params;

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

    const conversation = data.data;

    // get Agent data details
    async function fetchAgentData(agentId: string): Promise<AgentDataType | {}> {
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
            body: JSON.stringify({ agent_id: agentId, user_id })
        });
        const data = await resp.json();

        if (!data.success) return {}
        console.log('data', data);
        const agent = data.agent;
        const agentData: AgentDataType = {
            id: agent.id,
            name: agent.name,
            age: agent.age,
            personalities: agent.personality,
            socialStatus: agent.initial_status,
            memories: agent.initial_memory.split('\n'),
            archived: agent.archived
        };
        console.log('agentData', agentData);
        return agentData;
    }

    const userAgents = await Promise.all(conversation.user_agent_ids.map(fetchAgentData));
    const agents = await Promise.all(conversation.agent_ids.map(fetchAgentData));

    const conversationData: ConversationDataType = {
        id: conversation_id,
        name: conversation.name,
        agents,
        userAgents,
        messages: getConversationMessages(conversation.messages),
    };
    return {
        body: conversationData
    }

}) satisfies PageServerLoad;
