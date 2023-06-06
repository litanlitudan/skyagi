<script lang="ts">
    import { createSearchStore, searchHandler } from '$lib/room/stores/search';
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
    export let data;
    export const characterData = data.agents
    
    const characters = characterData.map((characterDataPoint) => ({
        ...characterDataPoint,
        image: "../src/lib/assets/Avatar1.png"
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




    let lastClickedCharacter = "..."
    function handleOnClickImageMessage(event) {
        console.log(event.detail.character.name);
        lastClickedCharacter = event.detail.character.name;
    }





    let selectedModel;
    let models = [
		{ value: 'openai-gpt-3.5-turbo', name: 'openai-gpt-3.5-turbo' },
		{ value: 'openai-gpt-4', name: 'openai-gpt-4' }
		// { value: 'chatglm-6b-modelz', name: 'chatglm-6b-modelz' },
		// { value: 'moss-16b-modelz', name: 'moss-16b-modelz' },
		// { value: 'vicuna-13b-modelz', name: 'vicuna-13b-modelz' },
		// { value: 'mpt-7b-modelz', name: 'mpt-7b-modelz' }
	];
    let checkedCharacterGroup = [];
    let playerCharacter;
    function charactersToItems(inputCharacters){
        let rst = []
        for (let i=0; i<inputCharacters.length; i++){
            rst.push({name: inputCharacters[i], value: inputCharacters[i]})
        }
        return rst
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
            Select Model for {lastClickedCharacter}
        </h1>
        <Label>Select an option
            <Select class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" items={models} bind:value={selectedModel}
            placeholder = "Select LLM" />
        </Label>

        <h1>
            API Key
        </h1>
        <input id="APIKeyField" placeholder="Input key">

        <h1>
            You will play...
        </h1>
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