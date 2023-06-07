export const load = async ({ fetch }) => {
    const charactersResponse = await fetch("/api/get-agents", {
        method: 'PUT',
        headers: {
            "Content-Type" : 'application/json'
        },
        body: JSON.stringify({user_id: "e776f213-b2c7-4fe1-b874-e2705ef99345"})
    })

    // const modelsResponse = await fetch('/api/get-models', {
    //     method: 'PUT', 
    //     headers: {
    //         "Content-Type" : 'application/json'
    //     }
    // })

    let agents = await charactersResponse.json()
    let models = {models: [{ value: 'openai-gpt-3.5-turbo', name: 'openai-gpt-3.5-turbo' },
                { value: 'openai-gpt-4', name: 'openai-gpt-4' }]}

    return {
        agents: agents,
        models: models
    }
}