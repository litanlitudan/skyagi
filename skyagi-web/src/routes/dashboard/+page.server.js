

export const load = async ({ fetch }) => {
    const snapShotToText = async (conversation) => {
        let rstText = ""
        let snapShot = conversation.snapshot
        if (snapShot == null){
            console.log("returend")
            return rstText
        }
        console.log(snapShot)
        for (let i=0; i < snapShot.length; i++){
            let message = snapShot[snapShot.length-i-1]
            let agentResponse = await fetch("/api/get-agent", {
                method: 'PUT', 
                headers: {
                    "Content-Type" : 'application/json'
                },
                body: JSON.stringify({agent_id: message.initiate_agent_id})
            })
            
            let agentData = await agentResponse.json()
            let agentName = agentData.data.name
            console.log(agentData)
            rstText += agentName + " " + message.content + "\n"
        }
        return {name: conversation.name, 
                text: rstText}
    }




    const charactersResponse = await fetch("/api/get-agents", {
        method: 'PUT',
        headers: {
            "Content-Type" : 'application/json'
        },
        body: JSON.stringify({user_id: "e776f213-b2c7-4fe1-b874-e2705ef99345"})
    })
    let agents = await charactersResponse.json()

    const conversationsResponse = await fetch("/api/get-conversations", {
        method: 'PUT',
        headers: {
            "Content-Type" : 'application/json'
        },
        body: JSON.stringify({user_id: "e776f213-b2c7-4fe1-b874-e2705ef99345"})
    })
    let conversationsData = await conversationsResponse.json()
    let conversations = conversationsData.conversations
    let rstLs = Promise.all(conversations.map((item)=>(snapShotToText(item))))
    return {
        agents: agents,
        conversations: rstLs
    }
}