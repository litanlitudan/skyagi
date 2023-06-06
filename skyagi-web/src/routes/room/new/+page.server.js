export const load = async ({ fetch }) => {
    const charactersResponse = await fetch("/api/get-agents", {
        method: 'PUT',
        headers: {
            "Content-Type" : 'application/json'
        },
        body: JSON.stringify({user_id: "e971a95c-e503-455c-bdd4-8a5a27efa116"})
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