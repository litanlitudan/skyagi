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
        if (snapShot == null){
            console.log("returend")
            return rstText
        }
        for (let i=0; i < snapShot.length; i++){
            let message = snapShot[snapShot.length-i-1]
            let agentResponse = await fetch("/api/get-agent", {
                method: 'PUT', 
                headers: {
                    "Content-Type" : 'application/json'
                },
                body: JSON.stringify({agent_id: message.initiate_agent_id,
                                      user_id: user_id})
            })
            
            let agentData = await agentResponse.json()
            console.log(agentData)
            console.log(message.initiate_agent_id)
            let agentName = agentData.data.name
            rstText += agentName + " " + message.content + "\n"
        }
        return {name: conversation.name, 
                text: rstText}
    }

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
    conversations = conversationsData.conversations;
    let rstLs = Promise.all(conversations.map((item)=>(snapShotToText(item))))
    return {
        agents: agents,
        conversations: rstLs
    }
}) satisfies PageServerLoad;