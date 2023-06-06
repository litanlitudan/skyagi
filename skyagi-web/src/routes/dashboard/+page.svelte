<script lang="ts">
    import Character from '$lib/dashboard-character.svelte';
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    import Conversation from '$lib/dashboard-conversation.svelte'
    

    export const characters = [
        {name: "tan li", image: "../src/lib/assets/Avatar1.png", title:"", description:""},
        {name: "yy", image: "../src/lib/assets/Avatar2.png", title:"", description:""},
        {name: "Vegeta", image: "../src/lib/assets/Avatar3.png", title:"", description:""},
        {name: "Goku", image:"../src/lib/assets/Avatar3.png", title:"", description:""},
        {name: "Sheldon", image:"../src/lib/assets/Avatar2.png", title:"", description:""}];
    export const conversations = [
        "Hello hahaha",
        "This is another test conversation"
    ]
</script>


<div id="globalGrid">
    <div>
        <Accordion id="conversationBoard">
            {#each conversations as conversationText, i}
                <Conversation conversationIndex={i+1} {conversationText} >
                </Conversation>
            {/each}
        </Accordion>
        <div id="buttonGrid">
            <button>
                Create new conversation
            </button>
            <button>
                Create new agent
            </button>
        </div>
    </div>
    
    <div class="scroller">
        {#each characters as character, i}
            <div class="characterInfoSet">
                <Character {character}>
                </Character>
            </div>
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