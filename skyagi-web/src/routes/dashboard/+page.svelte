<script lang="ts">
	import Character from '$lib/dashboard-character.svelte';
	import { Accordion, Button, Spinner } from 'flowbite-svelte';
	import Conversation from '$lib/dashboard-conversation.svelte';
	import { globalAvatarImageList } from '$lib/stores.js';
	import Error from '$lib/Error.svelte';
	export let data;
	export let activeId = '';

	const getCharacters = data.streamed.agents.then(value => {
		return value.map((characterDataPoint: any) => {
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
	});

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
		<div class="conversationscroller">
			<Accordion
				id="conversationBoard"
				activeClasses="bg-gray-800 text-white focus:ring-4 focus:ring-blue-800 text-2xl"
				inactiveClasses="text-gray-400 hover:bg-gray-800 text-2xl"
			>
				{#await data.streamed.conversations}
					<div class="text-center"><Spinner /></div>
				{:then value}
					{#each value as conversation, i}
						<Conversation
							conversationIndex={i + 1}
							conversationSummary={conversation}
							conversationId={conversation.conversationId}
							bind:activeId
						/>
					{/each}
				{:catch error}
					<Error errorCode={500} errorName={error.name || ''} errorMsg={error.message} />
				{/await}
			</Accordion>
		</div>
		<div id="buttonGrid">
			<Button size="xl" on:click={handleResumeRoomClick}>Resume to the selected conversation</Button
			>
			<Button size="xl" on:click={handleCreateRoomClick}>Create new conversation</Button>
			<Button size="xl" on:click={handleCreateAgentClick}>Create new agent</Button>
		</div>
	</div>

	<div class="scroller">
		{#await getCharacters}
			<div class="text-center"><Spinner /></div>
		{:then value}
			{#each value as character, i}
				<a href="agent/{character.id}">
					<div class="characterInfoSet">
						<Character {character} imageUrl={character.image} />
					</div>
				</a>
			{/each}
		{:catch error}
			<Error errorCode={500} errorName={error.name || ''} errorMsg={error.message} />
		{/await}
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

	.conversationscroller {
		border: none;
		width: 600px;
		height: 1000px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		grid-template-rows: repeat(auto-fill, 950px);
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
		width: 600px;
		grid-template-rows: (3, 50%);
	}
</style>
