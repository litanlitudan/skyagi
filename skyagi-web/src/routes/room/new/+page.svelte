<script lang="ts">
    import { createSearchStore, searchHandler } from '$lib/room/stores/search';
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label, Button } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
    export let data;
    import { browser } from '$app/environment';
    export const characterData = data.agents
    export const modelData = data.models
    import modelTokenDataStore from '$lib/room-store.js';
    import { globalAvatarImageList } from '$lib/stores.js';

    let selectedModelData;
    modelTokenDataStore.subscribe((data) => {
        selectedModelData = data;
    })
    let models = modelData
    let chatName = ""
    
    let characters = characterData.map(function(characterDataPoint) {
        let imagePath = "/assets/Avatar1.png"
		if (characterDataPoint.avatar!=null && characterDataPoint.avatar.local_path in globalAvatarImageList){
			imagePath = characterDataPoint.avatar.local_path
		};
        return {
        ...characterDataPoint,
        image: imagePath,
        model: models[0].value,
        modelToken: "",
        selected:false,
        avatarStyle: "rounded-lg border-none border-4 hover:border-solid border-indigo-600"
    }})
    function filterCharacters(inputCharacters){
        let rst = []
        for (let i=0; i<inputCharacters.length; i++){
            if (inputCharacters[i].selected == true){
                rst.push(inputCharacters[i])
            }
        }
        return rst
    }
    $: selectedCharacters = filterCharacters(characters)

    const searchStore = createSearchStore(characters);

    const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

    onDestroy(()=> {
        unsubscribe();
    });


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
    let checkedCharacterGroup = [];
    let playerCharacterId="";
    function charactersToItems(inputCharacters){
        let rst = []
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
    let createDisabled = true
    function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
        let selectedCount = 0;
        // console.log("called")
        for (let i=0; i<inputCharacters.length; i++){
            if (inputCharacters[i].selected){
                selectedCount++
                if (inputCharacters[i].model=="" || inputCharacters[i].modelToken==""){
                    console.log("condition1")
                    return true
                }
            }
        }
        console.log(selectedCount)
        if (selectedCount < 2){
            console.log("condition2")
            return true
        }
        if (inputChatName==""){
            console.log("condition3")
            return true
        }
        if (inputPlayerCharacter==""){
            console.log("condition4")
            return true
        }
        return false
    }
    $: createDisabled = checkCreateButtonDisabled(characters, chatName, playerCharacterId)
    const handleCreateButton = async () => {
        console.log(selectedCharacters)
        // console.log(selectedCharacters)
        
        let inputAgents = selectedCharacters.map((item) => (
            {id: item.id, 
            model: {
                name: item.model,
                token: item.modelToken
            }}))
        // console.log(inputAgents)
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
                 bind:avatarStyle={characters[i].avatarStyle}
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
        <Button on:click={handleCreateButton} bind:disabled={createDisabled}>
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