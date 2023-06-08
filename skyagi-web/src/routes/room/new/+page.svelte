<script lang="ts">
    import { createSearchStore, searchHandler } from '$lib/room/stores/search';
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label, Button } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
    export let data;
    import { browser } from '$app/environment';
    export const characterData = data.agents.agents
    export const modelData = data.models.models
    import modelTokenDataStore from '$lib/room-store.js';

    let selectedModelData;
    modelTokenDataStore.subscribe((data) => {
        selectedModelData = data;
        console.log(data)
    })
    let models = modelData
    let chatName = ""
    
    let characters = characterData.map((characterDataPoint) => ({
        ...characterDataPoint,
        image: "../src/lib/assets/Avatar1.png",
        model: "",
        modelToken: "",
        selected:false
    }))

    const searchStore = createSearchStore(characters);

    const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

    onDestroy(()=> {
        unsubscribe();
    });


    let lastClickedCharacterName = "..."
    let lastClickedCharacter = characters[0]
    let showedModelValue = ""
    let showedTokenValue = ""
    function handleOnClickImageMessage(event) {
        console.log(event.detail.character.name);
        lastClickedCharacterName = event.detail.character.name;
        lastClickedCharacter = event.detail.character;
        showedModelValue = event.detail.character.model;
        showedTokenValue = event.detail.character.modelToken;
        console.log(showedModelValue)
        if (browser) {
            let modelSelect = document.getElementById("modelSelect")
            let tokenField = document.getElementById("tokenField")
            if (showedTokenValue == ""){
                console.log("empty string")
            }
            modelSelect.value = showedModelValue;
            tokenField.value = showedTokenValue;
        }
    }


    let selectedModel="";
    let selectedToken="";
    let checkedCharacterGroup = [];
    let playerCharacterId;
    function charactersToItems(inputCharacters){
        let rst = []
        console.log(inputCharacters)
        for (let i=0; i<inputCharacters.length; i++){
            if (inputCharacters[i].selected){
                rst.push({name: inputCharacters[i].name, value: inputCharacters[i].id})
            }
        }
        return rst
    }

    function handleModelChange() {
        lastClickedCharacter.model = selectedModel
    }

    function handleTokenInput() {
        lastClickedCharacter.modelToken = selectedToken
    }

    const handleCreateButton = async () => {
        let selectedCharacters = characters.filter((item) => item.selected==false)
        let agent_ids = selectedCharacters.map((item) => (item.id))
        const conversationResponse = await fetch("/api/create-conversation", {
            method: 'PUT',
            headers: {
                "Content-Type" : 'application/json'
            },
            body: JSON.stringify({
                name: chatName,
                user_id: "e776f213-b2c7-4fe1-b874-e2705ef99345",
                agent_ids: agent_ids,
                user_agent_ids: [playerCharacterId]
            })
        })
        let conversation_id = await conversationResponse.json()
        modelTokenDataStore.update((currentData) => {
            return characters.map((item) => ({
                agent_id: item.id, 
                model: item.model,
                token: item.modelToken}))

        })
        window.location.href = '/room/' + conversation_id.conversation_id
    }
</script>

<div id="globalGrid">
    
    <div>
        <input id="searchBar" type="search" placeholder="Search..." bind:value={$searchStore.search} />
    </div>
    
    <div class="scroller">
        {#each $searchStore.filtered as character, i}
            <div class="characterInfoSet">
                <Character bind:character={character} 
                 bind:characters={characters}
                 on:message={handleOnClickImageMessage} 
                 bind:bindGroup={checkedCharacterGroup} 
                 value={character.name}>
                </Character>
            </div>
        {/each}
    </div>

    <input id="chatNameField" placeholder="Chat name" bind:value={chatName}>

    <div>
        <h1>
            Select Model for {lastClickedCharacterName}
        </h1>
        <Label>Select an option
            <Select class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
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
        <Button on:click={handleCreateButton}>
            Create
        </Button>

    </div>
</div>


<style>
    #searchBar {
        width: 200px
    }

    #chatNameField {
        width: 200px
    }


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
        grid-template-rows: repeat(2, 50px);
        grid-auto-flow: column;
        gap: 10px;
        /* grid-auto-columns: 400px 400px; */
    }


</style>