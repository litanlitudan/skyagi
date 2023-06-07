export const load = async ({ fetch }) => {
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
    let conversations = await conversationsResponse.json()
    return {
        agents: agents,
        conversations: conversations
    }
}