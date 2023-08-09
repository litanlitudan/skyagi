<script lang="ts">
	import Character from '$lib/dashboard-character.svelte';
	import { Accordion, Button, Spinner } from 'flowbite-svelte';
	import Conversation from '$lib/dashboard-conversation.svelte';
	import { globalAvatarImageList } from '$lib/stores.js';
	import Error from '$lib/Error.svelte';
	import { _loadPresetConversationsAndCharacters } from './+page';
	import { goto } from '$app/navigation';
	export let data;
	export let activeId = '';
	let user_id = data.user_id;

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
	let popUpError = false;
	let errorName = 'Selection Error';
	let errorMsg = '';

	function handleResumeRoomClick() {
		if (activeId == '') {
			popUpError = true;
			errorMsg = 'Please select a conversation to resume';
			return false;
		}
		window.location.href = '/room/resume-room/' + activeId;
	}

	function handleCreateAgentClick() {
		window.location.href = '/agent/create';
	}

	function handleCreateRoomClick() {
		window.location.href = '/room/new';
	}

	function handleLoadPresetConversations() {
		_loadPresetConversationsAndCharacters(user_id);
		location.reload();
	}
</script>

<div id="globalGrid">
	<div>
		<div id="conversationscroller" class="rounded-lg">
			<Accordion
				id="conversationBoard"
				activeClasses="bg-gray-800 text-white ring-0 text-lg border-0"
				inactiveClasses="bg-gray-700 text-gray-400 hover:bg-gray-800 text-lg border-0"
				class="border-0 divide-y-1 !divide-gray-600 rounded-none group-first:rounded-t-xl"
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
		</div>
	</div>
	<div>
		<div class="scroller">
			{#await getCharacters}
				<div class="text-center"><Spinner /></div>
			{:then value}
				{#if value.length == 0}
					<div id="buttonGrid">
						<Button size="xl" color="green" on:click={handleLoadPresetConversations}
							>Load preset characters</Button
						>
					</div>
				{/if}
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
		<div id="buttonGrid">
			<Button size="xl" on:click={handleCreateAgentClick}>Create new agent</Button>
		</div>
	</div>
	<Error {errorName} {errorMsg} {popUpError} />
</div>

<style>
	.scroller {
		width: 600px;
		height: 600px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(3, 250px);
		grid-template-rows: repeat(auto-fill, 150px);
	}

	#conversationscroller {
		border: none;
		width: 600px;
		height: 600px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		/* grid-template-rows: repeat(auto-fill, 950px); */
	}

	#conversationBoard {
		height: 600px;
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
		padding-top: 50px;
		position: relative;
		grid-template-rows: (2, 50%);
	}
</style>
