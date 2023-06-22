<script lang="ts">
    import { createSearchStore, searchHandler } from '$lib/room/stores/search';
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label, Button, Dropdown, DropdownItem, Chevron, Checkbox, Search, Alert } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
    export let data;
    import { browser } from '$app/environment';
    export const characterData = data.agents
    export const modelData = data.models
    export const userId = data.userId
    import modelTokenDataStore from '$lib/room-store.js';
    import { globalAvatarImageList } from '$lib/stores.js';
    import Toast from '$lib/Toast.svelte';
    
    import preSavedModelTokenDataStore from '$lib/token-store.js';
	import { notifications } from '$lib/notifications.js';
    let preSavedModelTokenDataIsEmpty = $preSavedModelTokenDataStore.length == 0;
    export let modelTokenPair = modelData.map((item)=>({
        [item.name]: ""
    }))
    let preSavedModelTokenData = $preSavedModelTokenDataStore
    if ((preSavedModelTokenDataIsEmpty || (preSavedModelTokenDataStore == null)) !== true) {
        let tempModelTokenData = JSON.parse(preSavedModelTokenData)
        modelTokenPair = {}
        for (let i=0; i<tempModelTokenData.length; i++){
            modelTokenPair[tempModelTokenData[i].model] = tempModelTokenData[i].token
        }
    }

    let selectedModelData;
    modelTokenDataStore.subscribe((data) => {
        selectedModelData = data;
    })
    let models = modelData
    let chatName = ""
    
    let characters = characterData.map(function(characterDataPoint) {
        let imagePath = "/assets/Avatar1.png"
		if (characterDataPoint.avatar!=null && globalAvatarImageList.includes(characterDataPoint.avatar.local_path)){
			imagePath = characterDataPoint.avatar.local_path
		};
        return {
        ...characterDataPoint,
        image: imagePath,
        model: models[0].value,
        modelTokenPair: {...modelTokenPair},
        selected:false,
        avatarStyle: "rounded-lg border-none border-4 hover:border-solid border-indigo-600"
    }})

    const searchStore = createSearchStore(characters);

    const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

    onDestroy(()=> {
        unsubscribe();
    });


    let lastClickedCharacterName = characters[0].name
    let lastClickedCharacter = characters[0]
    characters[0].avatarStyle = "rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600"
    let showedModelValue = models[0].value
    let showedTokenValue = modelTokenPair[models[0].value]
    function handleOnClickImageMessage(event) {
        lastClickedCharacterName = event.detail.character.name;
        lastClickedCharacter = event.detail.character;
        showedModelValue = event.detail.character.model;
        showedTokenValue = event.detail.character.modelTokenPair[showedModelValue];
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
    let selectedToken=modelTokenPair[models[0].value];
    let checkedCharacterGroup = [];
    let playerCharacterId="";
    function charactersToItems(inputCharacters){
        let rst = []
        for (let i=0; i<inputCharacters.length; i++){
            rst.push({name: inputCharacters[i].name, value: inputCharacters[i].id})
        }
        return rst
    }
    $: characterItems= charactersToItems(checkedCharacterGroup);

    function handleModelChange() {
        lastClickedCharacter.model = selectedModel
        selectedToken = lastClickedCharacter.modelTokenPair[selectedModel]
    }

    function handleTokenInput() {
        lastClickedCharacter.modelTokenPair[selectedModel] = selectedToken
    }
    let createDisabled = true
    function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
        let selectedCount = 0;
        for (let i=0; i<inputCharacters.length; i++){
                selectedCount++
                if (inputCharacters[i].model=="" || inputCharacters[i].modelTokenPair[inputCharacters[i].model]==""){
                    return -1
                }
        }
        if (selectedCount < 2){
            return -2
        }
        if (selectedCount > 4){
            return -3
        }
        if (inputChatName==""){
            return -4
        }
        if (inputPlayerCharacter==""){
            return -5
        }
        return 1
    }
    $: createDisabled = checkCreateButtonDisabled(checkedCharacterGroup, chatName, playerCharacterId)
    const handleCreateButton = async () => {
        let createStatus = checkCreateButtonDisabled(checkedCharacterGroup, chatName, playerCharacterId)
        if (createStatus == -1){
            notifications.danger("One or more characters' model or token is not specified", 2000)
            return null
        }
        if (createStatus == -2){
            notifications.danger("Need to choose 2 or more characters", 2000)
            return null
        }
        if (createStatus == -3){
            notifications.danger("Need to choose 4 or less characters", 2000)
            return null
        }
        if (createStatus == -4){
            notifications.danger("Chat name is not specified", 2000)
            return null
        }
        if (createStatus == -5){
            notifications.danger("Player character is not specified", 2000)
            return null
        }
        let inputAgents = checkedCharacterGroup.map((item) => (
            {id: item.id, 
            embedding_model_settings: {
                type: "OpenAIEmbeddings",
                provider: "OpenAI",
                name: item.model,
                args:{
                    modelName: "text-embedding-ada-002",
                    openAIApiKey: item.modelTokenPair[item.model]
                },
                embeddingSize: 1536
            }}))
        console.log([playerCharacterId])
        const conversationResponse = await fetch("/api/create-conversation", {
            method: 'PUT',
            headers: {
                "Content-Type" : 'application/json'
            },
            body: JSON.stringify({
                name: chatName,
                user_id: userId,
                agents: inputAgents,
                user_agent_ids: [playerCharacterId]
            })
        })
        let conversation_id = await conversationResponse.json()
        modelTokenDataStore.update((currentData) => {
            return characters.map((item) => ({
                agent_id: item.id, 
                model: item.model,
                token: item.modelTokenPair[item.model]
            }))
        })
        console.log(conversation_id)
        console.log(checkedCharacterGroup)
        if (conversation_id.success){
            window.location.href = '/room/' + conversation_id.conversation_id
        }
        else{
            console.log(conversation_id.error)
        }
    }
    // function testHandle(){
    //     notifications.danger("abc", 1000)
    // }
</script>

<div id="globalGrid">
    
    <div>
        <Button><Chevron>Available Characters</Chevron>></Button>
            <Dropdown>
                <div slot="header" class="p-3">
                    <Search id="searchBar" placeholder="Search..." bind:value={$searchStore.search} />  
                </div>
                {#each $searchStore.filtered as character, i}
                <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <Checkbox bind:group={checkedCharacterGroup} value={character}>{character.name}</Checkbox>
                </li>
                {/each}
            </Dropdown>
    </div>
    
    <div class="scroller">
        {#each checkedCharacterGroup as character, i}
            <div class="characterInfoSet">
                <Character bind:character={character} 
                 bind:characters={characters}
                 on:message={handleOnClickImageMessage} 
                 bind:avatarStyle={characters[i].avatarStyle}>
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
         on:focusout={handleTokenInput}
         bind:value={selectedToken}>


        <Label class="mb-10 w-1/2">Select an option
            <Select id="playerDropDown" class="mt-5" size="lg" 
            items={characterItems} 
            bind:value={playerCharacterId}
            placeholder = "Select your character" />
        </Label>
        <Button on:click={handleCreateButton}>
            Create
        </Button>

    </div>
</div>
<Toast />


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