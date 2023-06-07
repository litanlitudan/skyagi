<script lang="ts">
    import { createSearchStore, searchHandler } from '$lib/room/stores/search';
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
    export let data;
    import { browser } from '$app/environment';
    export const characterData = data.agents.agents
    export const modelData = data.models.models
    let models = modelData
    
    const characters = characterData.map((characterDataPoint) => ({
        ...characterDataPoint,
        image: "../src/lib/assets/Avatar1.png",
        model: "",
        modelToken: ""
    }))

    const searchCharacters = characters.map((character) => ({
        ...character,
        searchTerms: `${character.name}`
    }));
    const searchStore = createSearchStore(searchCharacters);

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
    let playerCharacter;
    function charactersToItems(inputCharacters){
        let rst = []
        for (let i=0; i<inputCharacters.length; i++){
            rst.push({name: inputCharacters[i], value: inputCharacters[i]})
        }
        return rst
    }

    function handleModelChange() {
        lastClickedCharacter.model = selectedModel
    }

    function handleTokenInput() {
        lastClickedCharacter.modelToken = selectedToken
    }
</script>

<div id="globalGrid">
    
    <div>
        <input id="searchBar" type="search" placeholder="Search..." bind:value={$searchStore.search} />
    </div>
    
    <div class="scroller">
        {#each $searchStore.filtered as character, i}
            <div class="characterInfoSet">
                <Character {character} 
                 on:message={handleOnClickImageMessage} 
                 bind:bindGroup={checkedCharacterGroup} 
                 value={character.name}>
                </Character>
            </div>
        {/each}
    </div>

    <input id="chatNameField" placeholder="Chat name">

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
            items={charactersToItems(checkedCharacterGroup)} 
            bind:value={playerCharacter}
            placeholder = "Select your character" />
        </Label>
        <button>
            Create
        </button>

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