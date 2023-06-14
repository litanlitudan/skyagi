<script lang="ts">
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label, Button } from 'flowbite-svelte';
    export let data;
    import { browser } from '$app/environment';
    export const conversationId = data.conversation_id
    export const user = data.user
    export const agentData = data.agentData
    export const agentIds = data.agentIds
    export const userAgentIds = data.userAgentIds
    export const modelData = data.models
    export const chatName = data.chatName
    
    import modelTokenDataStore from '$lib/room-store.js';
    import { globalAvatarImageList } from '$lib/stores.js';

    let selectedModelData;
    modelTokenDataStore.subscribe((data) => {
        selectedModelData = data;
    })
    let models = modelData
    
    let characters = agentData.map(function(characterDataPoint) {
        let imagePath = "/assets/Avatar1.png"
		if (characterDataPoint.avatar!=null && globalAvatarImageList.includes(characterDataPoint.avatar.local_path)){
			console.log(characterDataPoint.avatar)
            imagePath = characterDataPoint.avatar.local_path
		};
        return {
        ...characterDataPoint,
        image: imagePath,
        model: models[0].value,
        modelToken: "",
        avatarStyle: "rounded-lg border-none border-4 hover:border-solid border-indigo-600"
    }})



    let lastClickedCharacterName = characters[0].name
    let lastClickedCharacter = characters[0]
    characters[0].avatarStyle = "rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600"
    let showedModelValue = models[0].value
    let showedTokenValue = ""
    function handleOnClickImageMessage(event) {
        lastClickedCharacterName = event.detail.character.name;
        lastClickedCharacter = event.detail.character;
        showedModelValue = event.detail.character.model;
        showedTokenValue = event.detail.character.modelToken;
        for (let i=0; i<characters.length; i++){
            if (characters[i].name==lastClickedCharacterName){
                characters[i].avatarStyle="rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600"
            }
            else{
                characters[i].avatarStyle="rounded-lg border-none border-4 hover:border-solid border-indigo-600"
            }
        }
        if (browser) {
            let modelSelect = document.getElementById("modelSelect")
            let tokenField = document.getElementById("tokenField")
            modelSelect.value = showedModelValue;
            tokenField.value = showedTokenValue;
        }
    }


    let selectedModel=models[0].value;
    let selectedToken="";
    let playerCharacterId="";
    function charactersToItems(inputCharacters){
        let rst = []
        for (let i=0; i<inputCharacters.length;i++){
            rst.push({name: inputCharacters[i].name, value: inputCharacters[i].id})
        }
        return rst
    }

    function handleModelChange() {
        lastClickedCharacter.model = selectedModel
    }

    function handleTokenInput() {
        lastClickedCharacter.modelToken = selectedToken
    }
    let createDisabled = true
    function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
        for (let i=0; i<inputCharacters.length; i++){
            if (inputCharacters[i].model=="" || inputCharacters[i].modelToken==""){
                console.log("condition1")
                return true
            }
        }
        if (inputPlayerCharacter==""){
            return true
        }
        return false
    }
    $: createDisabled = checkCreateButtonDisabled(characters, chatName, playerCharacterId)
    const handleCreateButton = async () => {
        
        let inputAgents = characters.map((item) => (
            {id: item.id, 
            model: {
                name: item.model,
                token: item.modelToken
            }}))
        const conversationResponse = await fetch("/api/create-conversation", {
            method: 'PUT',
            headers: {
                "Content-Type" : 'application/json'
            },
            body: JSON.stringify({
                name: chatName,
                user_id: "e776f213-b2c7-4fe1-b874-e2705ef99345",
                agents: inputAgents,
                user_agent_ids: [playerCharacterId]
            })
        })
        let conversation_id = await conversationResponse.json()
        modelTokenDataStore.update((currentData) => {
            return characters.map((item) => ({
                agent_id: item.id, 
                model: item.model,
                token: item.modelToken
            }))
        })
        console.log(conversation_id)
        if (conversation_id.success){
            window.location.href = '/room/' + conversation_id.conversation_id
        }
        else{
            console.log(conversation_id.error)
        }
    }
</script>

<div id="globalGrid">
    
    <div class="scroller">
        {#each characters as character, i}
            <div class="characterInfoSet">
                <Character bind:character={character} 
                 bind:characters={characters}
                 on:message={handleOnClickImageMessage}
                 bind:avatarStyle={characters[i].avatarStyle}
                 value={character.name}
                 hideCheckbox={"visibility: hidden"}>
                </Character>
            </div>
        {/each}
    </div>

    

    <div>
        <h1>
            {chatName}
        </h1>
        <!-- <input id="chatNameField" placeholder="Chat name" bind:value={chatName}> -->
        <h1>
            Select Model for {lastClickedCharacterName}
        </h1>
        <Label>Select an option
            <Select class="mt-5" size="lg" 
            items={models}
            bind:value={selectedModel}
            id="modelSelect"
            on:change={handleModelChange}
            placeholder = "Select LLM" />
        </Label>

        <h1>
            Model Token
        </h1>
        <input id="tokenField" placeholder="Input key"
         on:input={handleTokenInput}
         bind:value={selectedToken}>


        <Label class="mb-10 w-1/2">Select an option
            <Select id="playerDropDown" class="mt-5" size="lg" 
            items={charactersToItems(characters)} 
            bind:value={playerCharacterId}
            placeholder = "Select your character" />
        </Label>
        <Button on:click={handleCreateButton} bind:disabled={createDisabled}>
            Create
        </Button>
    </div>
</div>


<style>

    .scroller {
        width: 600px;
        height: 500px;
        top: 20px;
        position: relative;
        overflow-x: scroll;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(3, 200px);
        grid-template-rows: repeat(auto-fill, 220px);
    }

    #globalGrid {
        display: grid;
        grid-template-columns: repeat(2, 60%, 40%);
        grid-auto-flow: column;
        gap: 10px;
    }


</style>