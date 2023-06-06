<script lang="ts">
    import Character from '$lib/dashboard-character.svelte';
    import { AccordionItem, Accordion, Button} from 'flowbite-svelte';
    import Conversation from '$lib/dashboard-conversation.svelte'
    export let data;
    export const characterData = data.agents.agents
    export const conversationData = data.conversations.conversations
    console.log(conversationData)
    

    const characters = characterData.map((characterDataPoint) => ({
        ...characterDataPoint,
        image: "../src/lib/assets/Avatar1.png"
    }))
    export const conversations = conversationData.map((conversationDataPoint) => ({
        ...conversationDataPoint
    }))

    function handleCreateAgentClick() {
        window.location.href = '/agent/create'
    }
    const images = ["../src/lib/assets/Ale.png", "../src/lib/assets/Amy.png",
    "../src/lib/assets/Bella.png","../src/lib/assets/Coco.png","../src/lib/assets/Don.png","../src/lib/assets/Edgar.png",
    "../src/lib/assets/Ian.png","../src/lib/assets/Jack.png"]

</script>


<div id="globalGrid">
    <div>
        <Accordion id="conversationBoard">
            {#each conversations as conversation, i}
                <Conversation conversationIndex={i+1} conversationSummary = {conversation.conversationSummary} >
                </Conversation>
            {/each}
        </Accordion>
        <div id="buttonGrid">
            <Button on:click={handleCreateAgentClick}>
                Create new conversation
            </Button>
            <Button>
                Create new agent
            </Button>
        </div>
    </div>
    
    <div class="scroller">
        {#each characters as character, i}
            <a href= "agent/{character.id}">
            <div class="characterInfoSet">
                <Character {character} imageUrl={images[i]}>
                </Character>
            </div>
            </a>
        {/each}
    </div>

</div>




<style>

    #conversationBoard {
        height: 1000px;
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
        grid-template-columns: repeat(2, 40%);
        grid-auto-flow: column;
        gap: 10px;
        /* grid-auto-columns: 400px 400px; */
    }

    #buttonGrid {
        display: grid;
        grid-template-rows: (2, 50%);
    }

</style>