export const load = async ({ fetch }) => {
    const charactersResponse = await fetch("/api/get-agents", {
        method: 'PUT',
        headers: {
            "Content-Type" : 'application/json'
        },
        body: JSON.stringify({user_id: "e971a95c-e503-455c-bdd4-8a5a27efa116"})
    })

    let finalRst = await charactersResponse.json()

    return finalRst
}