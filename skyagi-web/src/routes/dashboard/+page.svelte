<script lang="ts">
    import Character from '$lib/dashboard-character.svelte';
    import { AccordionItem, Accordion, Button} from 'flowbite-svelte';
    import Conversation from '$lib/dashboard-conversation.svelte'
	import { globalAvatarImageList } from '$lib/stores.js';
    export let data;
    export const characterData = data.agents
    export const conversationData = data.conversations
    
    

    const characters = characterData.map(function(characterDataPoint) {
		let imagePath = "/assets/Avatar1.png"
		if (characterDataPoint.avatar!=null && characterDataPoint.avatar.local_path in globalAvatarImageList){
			imagePath = characterDataPoint.avatar.local_path
		};
		return {
			...characterDataPoint,
			image: imagePath
    }})

    
    export const conversations = conversationData

    function handleCreateAgentClick() {
        window.location.href = '/agent/create'
    }

    function handleCreateRoomClick() {
        window.location.href = '/room/new'
    }

</script>

<div id="globalGrid">

    <div>
        <Accordion id="conversationBoard">
            {#each conversations as conversation, i}
                <Conversation conversationIndex={i+1} conversationSummary = {conversation} >
                </Conversation>
            {/each}
        </Accordion>
        <div id="buttonGrid">
            <Button on:click={handleCreateRoomClick}>
                Create new conversation
            </Button>
            <Button on:click={handleCreateAgentClick}>
                Create new agent
            </Button>
        </div>
    </div>
    
    <div class="scroller">
        {#each characters as character, i}
            <a href= "agent/{character.id}">
            <div class="characterInfoSet">
                <Character {character} imageUrl={character.image}>
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
    #conversationBoard {
        height: 1000px;
        white-space: pre-line;
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
