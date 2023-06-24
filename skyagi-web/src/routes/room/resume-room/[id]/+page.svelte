<script lang="ts">
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label, Button } from 'flowbite-svelte';
    export let data;
    import { browser } from '$app/environment';
    export const conversationId = data.conversation_id
    export const user = data.user
    export const userId = data.userId
    export const agentData = data.agentData
    export const agentIds = data.agentIds
    export const userAgentIds = data.userAgentIds
    export const userAgentNames = data.userAgentNames
    export const modelData = data.models
    export const chatName = data.chatName
    export const messages = data.messages
    
    import modelTokenDataStore from '$lib/room-store.js';
    import { globalAvatarImageList } from '$lib/stores.js';

    let models = modelData
    import preSavedModelTokenDataStore from '$lib/token-store.js';
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
    
    let characters = agentData.map(function(characterDataPoint) {
        let imagePath = "/assets/Avatar1.png"
		if (characterDataPoint.avatar!=null && globalAvatarImageList.includes(characterDataPoint.avatar.local_path)){
            imagePath = characterDataPoint.avatar.local_path
		};
        return {
        ...characterDataPoint,
        image: imagePath,
        model: models[0].value,
        modelTokenPair: {...modelTokenPair},
        avatarStyle: "rounded-lg border-none border-4 hover:border-solid border-indigo-600"
    }})



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
        selectedToken = lastClickedCharacter.modelTokenPair[selectedModel]
    }

    function handleTokenInput() {
        lastClickedCharacter.modelTokenPair[selectedModel] = selectedToken
    }
    let createDisabled = true
    function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
        for (let i=0; i<inputCharacters.length; i++){
            if (inputCharacters[i].model=="" || inputCharacters[i].modelTokenPair[inputCharacters[i].model]==""){
                return true
            }
        }
        if (inputPlayerCharacter==""){
            return true
        }
        return false
    }
    function findModelDataByName (modelName){
        let dataPoint = modelData.find((item)=>(item.name==modelName))
        return dataPoint.data
    }
    $: createDisabled = checkCreateButtonDisabled(characters, chatName, playerCharacterId)
    const handleCreateButton = async () => {
        
        modelTokenDataStore.update((currentData) => {
            return JSON.stringify(characters.map((item) => ({
                agent_id: item.id, 
                model: item.model,
                token: item.modelTokenPair[item.model],
                data: findModelDataByName(item.model)
            })))
        })
        window.location.href = '/room/' + conversationId
    }
</script>

<div id="globalGrid">
    
    <div class="scroller">
        {#each characters as character, i}
            <div class="characterInfoSet">
                <Character bind:character={character} 
                 bind:characters={characters}
                 on:message={handleOnClickImageMessage}
                 bind:avatarStyle={characters[i].avatarStyle}>
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


        <h1>
            Your character is {userAgentNames[0]}
        </h1>
        <Button on:click={handleCreateButton}>
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