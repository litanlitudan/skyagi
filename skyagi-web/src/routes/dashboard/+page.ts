import Conversations from '$lib/examples/examples.json'

export const _loadPresetConversationsAndCharacters = async (user_id) => {
    const listOfConversations = ['TheBigBangTheory', 'CasedClosed', 'Zelda'];

    listOfConversations.forEach((conversation) => {
        let characters = Conversations[conversation];
        characters.forEach((character) => {
            _createCharacter(user_id, character);
        });
        // _createConversation(user_id, characters);
    })

}

const _createCharacter = async (user_id, agentData) => {
    const resp = await fetch('/api/create-agent', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({
            user_id,
            agent: {
                name: agentData.name,
                age: agentData.age,
                personality: agentData.personalities,
                status: agentData.socialStatus,
                memory: agentData.memories.join('\n'),
                avatar: {
                    cloud_path: '',
                    local_path: agentData.avatarPath
                }
            }
        })
    });
    const data = await resp.json();
    return data.success;
}

const _createConversation = async (user_id, characters) => { }
