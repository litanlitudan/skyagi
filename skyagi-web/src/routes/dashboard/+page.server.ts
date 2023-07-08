import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


export const load = (async ({ fetch, locals }) => {
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/');
    }
    const user_id = session.user.id;

    const snapShotToText = async (conversation) => {
        let rstText = ""
        let snapShot = conversation.snapshot
        if (snapShot == null) {
            return rstText
        }
        for (let i = 0; i < snapShot.length; i++) {
            let message = snapShot[snapShot.length - i - 1]
            let agentResponse = await fetch("/api/get-agent", {
                method: 'PUT',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify({
                    agent_id: message.initiate_agent_id,
                    user_id: user_id
                })
            })

            let agentData = await agentResponse.json()
            let agentName = agentData.agent.name
            rstText += agentName + " " + message.content + "\n"
        }
        return {
            name: conversation.name,
            text: rstText,
            conversationId: conversation.id
        }
    }

    const getAgents = async (user_id: string) => {
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

        return agents;
    }

    const getConversationHistory = async (user_id: string) => {
        const conversationsResponse = await fetch("/api/get-conversations", {
            method: 'PUT',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({ user_id })
        })
        const conversationsData = await conversationsResponse.json();
        let conversations = [];
        if (conversationsData.success) {
            conversations = conversationsData.conversations;

        }
        else {
            console.log("error")
        }

        return Promise.all(conversations.map((item) => (snapShotToText(item))));
    }

    return {
        streamed: {
            agents: getAgents(user_id),
            conversations: getConversationHistory(user_id)
        }
    }
}) satisfies PageServerLoad;