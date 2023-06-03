<script lang="ts">
    // import Scrolly from "./Scrolly.svelte";
    import Character from '$lib/room-new-character.svelte';
    import { Select, Label } from 'flowbite-svelte';

    export const characters = [
        {name: "tan li", image: "../src/lib/assets/Avatar1.png", title:"", description:""},
        {name: "yy", image: "../src/lib/assets/Avatar2.png", title:"", description:""},
        {name: "Vegeta", image: "../src/lib/assets/Avatar3.png", title:"", description:""},
        {name: "Goku", image:"../src/lib/assets/Avatar3.png", title:"", description:""},
        {name: "Sheldon", image:"../src/lib/assets/Avatar2.png", title:"", description:""}];

    let lastClickedCharacter = "..."
    function handleOnClickImageMessage(event) {
        console.log(event.detail.character.name);
        lastClickedCharacter = event.detail.character.name;
    }




    function getNthPicPositionStr(inputVal) {
        let startPointX = 120;
        let startPointY = 150;
        let widthX = 200;
        let widthY = 200;
        let leftVal = (inputVal%3) * widthX+startPointX
        let topVal = Math.floor(inputVal/3) * widthY+startPointY
        // console.log("positin:absolute;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px") 
        return "position:static;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px"
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
        <input id="searchBar" type="search" placeholder="Search..." />
    </div>
    
    <div class="scroller">
        {#each characters as character, i}
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
            <Select id="playerDropDown" class="mt-5" size="lg" items={charactersToItems(checkedCharacterGroup)} bind:value={playerCharacter}
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