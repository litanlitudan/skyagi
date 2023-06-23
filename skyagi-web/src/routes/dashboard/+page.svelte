<script lang="ts">
	import Character from '$lib/dashboard-character.svelte';
	import { AccordionItem, Accordion, Button } from 'flowbite-svelte';
	import Conversation from '$lib/dashboard-conversation.svelte';
	import { globalAvatarImageList } from '$lib/stores.js';
	export let data;
	const characterData = data.agents;
	const conversationData = data.conversations;
	export let activeId = '';
	if (conversationData.length != 0) {
		conversationData[0].conversationId;
	}

	const characters = characterData.map(function (characterDataPoint) {
		let imagePath = '/assets/Avatar1.png';
		if (
			characterDataPoint.avatar != null &&
			globalAvatarImageList.includes(characterDataPoint.avatar.local_path)
		) {
			imagePath = characterDataPoint.avatar.local_path;
		}
		return {
			...characterDataPoint,
			image: imagePath
		};
	});

	export const conversations = conversationData;
	let conversationOpenLs = conversations.map(item => false);
	conversationOpenLs[0] = true;

	function handleResumeRoomClick() {
		window.location.href = '/room/resume-room/' + activeId;
	}

	function handleCreateAgentClick() {
		window.location.href = '/agent/create';
	}

	function handleCreateRoomClick() {
		window.location.href = '/room/new';
	}
</script>

<div id="globalGrid">
	<div>
		<Accordion
			id="conversationBoard"
			activeClasses="bg-gray-800 text-white focus:ring-4 focus:ring-blue-800 text-2xl"
			inactiveClasses="text-gray-400 hover:bg-gray-800 text-2xl"
		>
			{#each conversations as conversation, i}
				<Conversation
					conversationIndex={i + 1}
					conversationSummary={conversation}
					conversationId={conversation.conversationId}
					bind:activeId
				/>
			{/each}
		</Accordion>
		<div id="buttonGrid">
			<Button size="xl" on:click={handleResumeRoomClick}>
				Resume to the selected conversation
			</Button>
			<Button size="xl" on:click={handleCreateRoomClick}>Create new conversation</Button>
			<Button size="xl" on:click={handleCreateAgentClick}>Create new agent</Button>
		</div>
	</div>

	<div class="scroller">
		{#each characters as character, i}
			<a href="agent/{character.id}">
				<div class="characterInfoSet">
					<Character {character} imageUrl={character.image} />
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.scroller {
		width: 600px;
		height: 500px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(3, 200px);
		/*grid-template-rows: repeat(auto-fill, 220px);*/
	}
	#conversationBoard {
		height: 2000px;
		white-space: pre-line;
	}

	#globalGrid {
		display: grid;
		grid-template-columns: repeat(2, 40%);
		grid-auto-flow: column;
		gap: 200px;
		/* grid-auto-columns: 400px 400px; */
	}

	#buttonGrid {
		display: grid;
		grid-template-rows: (3, 50%);
	}
</style>
