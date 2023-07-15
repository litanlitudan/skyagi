<script lang="ts">
	import { createSearchStore, searchHandler } from '$lib/room/stores/search';
	import Character from '$lib/room-new-character.svelte';
	import {
		Select,
		Label,
		Button,
		Dropdown,
		DropdownItem,
		Chevron,
		Checkbox,
		Search,
		Alert,
		Avatar,
		Input
	} from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	export let data;
	import { browser } from '$app/environment';
	export const characterData = data.agents;
	export const modelData = data.models;
	export const embeddingData = data.embeddings;
	export const userId = data.userId;
	import modelTokenDataStore from '$lib/room-store.js';
	import { globalAvatarImageList } from '$lib/stores.js';
	import Toast from '$lib/Toast.svelte';

	import preSavedModelTokenDataStore from '$lib/token-store.js';
	import { notifications } from '$lib/notifications.js';
	let preSavedModelTokenDataIsEmpty = $preSavedModelTokenDataStore.length == 0;
	export let modelTokenPair = modelData.map(item => ({
		[item.name]: ''
	}));
	let preSavedModelTokenData = $preSavedModelTokenDataStore;
	if ((preSavedModelTokenDataIsEmpty || preSavedModelTokenDataStore == null) !== true) {
		let tempModelTokenData = JSON.parse(preSavedModelTokenData);
		/*modelTokenPair = {};*/
		for (let i = 0; i < tempModelTokenData.length; i++) {
			modelTokenPair[tempModelTokenData[i].model] = tempModelTokenData[i].token;
		}
	}

	let models = modelData.map(model => ({ value: model.value, name: model.value }));
	let chatName = '';

	let characters = characterData.map(function (characterDataPoint) {
		let imagePath = '';
		if (
			characterDataPoint.avatar != null &&
			globalAvatarImageList.includes(characterDataPoint.avatar.local_path)
		) {
			imagePath = characterDataPoint.avatar.local_path;
		}
		return {
			...characterDataPoint,
			image: imagePath,
			model: '',
			modelTokenPair: { ...modelTokenPair },
			selected: false,
			avatarStyle: 'rounded-lg border-none border-4 hover:border-solid border-indigo-600'
		};
	});

	const size = 10; // Specify the desired size of the array

	let isAgentSelectable: boolean[] = Array(characters.length).fill(true);

	const searchStore = createSearchStore(characters);

	const unsubscribe = searchStore.subscribe(model => searchHandler(model));

	onDestroy(() => {
		unsubscribe();
	});

	let lastClickedCharacter;
	let lastClickedCharacterName;
	let showedModelValue;
	let selectedModel = '';
	let selectedToken = '';
	function handleOnClickImageMessage(event) {
		lastClickedCharacter = event.detail.character;
		lastClickedCharacterName = event.detail.character.name;
		showedModelValue = event.detail.character.model;
		for (let i = 0; i < characters.length; i++) {
			if (characters[i].name == lastClickedCharacterName) {
				characters[i].avatarStyle =
					'rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600';
			} else {
				characters[i].avatarStyle =
					'rounded-lg border-none border-4 hover:border-solid border-indigo-600';
			}
		}
		if (browser) {
			let modelSelect = document.getElementById('modelSelect');
			let tokenField = document.getElementById('tokenField');
			if (showedModelValue !== '') {
				modelSelect.value = showedModelValue;
				selectedModel = showedModelValue;
				let savedTokenValue = event.detail.character.modelTokenPair[showedModelValue];
				if (savedTokenValue && savedTokenValue !== '') {
					tokenField.value = savedTokenValue;
				} else {
					tokenField.value = '';
					selectedToken = '';
				}
			} else {
				if (modelSelect && 'value' in modelSelect) {
					modelSelect.value = '';
					selectedModel = '';
				}
				if (tokenField && 'value' in tokenField) {
					tokenField.value = '';
					selectedToken = '';
				}
			}
		}
	}

	let checkedCharacterGroup = [];
	let playerCharacterId = '';
	function charactersToItems(inputCharacters) {
		let rst = [];
		for (let i = 0; i < inputCharacters.length; i++) {
			rst.push({ name: inputCharacters[i].name, value: inputCharacters[i].id });
		}
		return rst;
	}
	$: characterItems = charactersToItems(checkedCharacterGroup);

	function updateAgentSelectable() {
		if (checkedCharacterGroup.length >= 4) {
			isAgentSelectable = characters.map(character =>
				checkedCharacterGroup.some(checkedCharacter => checkedCharacter.id === character.id)
			);
		} else {
			isAgentSelectable = isAgentSelectable.map(() => true);
		}
	}

	function handleModelChange() {
		lastClickedCharacter.model = selectedModel;
		selectedToken = lastClickedCharacter.modelTokenPair[selectedModel];
	}

	function handleTokenInput() {
		lastClickedCharacter.modelTokenPair[selectedModel] = selectedToken;
	}
	function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
		let selectedCount = 0;
		for (let i = 0; i < inputCharacters.length; i++) {
			selectedCount++;
			if (
				inputCharacters[i].model == '' ||
				inputCharacters[i].modelTokenPair[inputCharacters[i].model] == ''
			) {
				return -1;
			}
		}
		if (selectedCount < 2) {
			return -2;
		}
		if (selectedCount > 4) {
			return -3;
		}
		if (inputChatName == '') {
			return -4;
		}
		if (inputPlayerCharacter == '') {
			return -5;
		}
		return 1;
	}

	function findModelDataByName(modelName) {
		let dataPoint = modelData.find(item => item.name == modelName);
		return dataPoint.data;
	}
	const handleCreateButton = async () => {
		let createStatus = checkCreateButtonDisabled(
			checkedCharacterGroup,
			chatName,
			playerCharacterId
		);
		if (createStatus == -1) {
			notifications.danger("One or more characters' model or token is not specified", 2000);
			return null;
		}
		if (createStatus == -2) {
			notifications.danger('Need to choose 2 or more characters', 2000);
			return null;
		}
		if (createStatus == -3) {
			notifications.danger('Need to choose 4 or less characters', 2000);
			return null;
		}
		if (createStatus == -4) {
			notifications.danger('Chat name is not specified', 2000);
			return null;
		}
		if (createStatus == -5) {
			notifications.danger('Player character is not specified', 2000);
			return null;
		}
		let inputAgents = checkedCharacterGroup.map(item => ({
			id: item.id,
			embedding_model_settings: {
				type: 'OpenAIEmbeddings',
				provider: 'OpenAI',
				name: item.model,
				args: {
					modelName: 'text-embedding-ada-002',
					openAIApiKey: item.modelTokenPair[item.model]
				},
				embeddingSize: 1536
			}
		}));
		const conversationResponse = await fetch('/api/create-conversation', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: chatName,
				user_id: userId,
				agents: inputAgents,
				user_agent_ids: [playerCharacterId]
			})
		});
		let conversation_id = await conversationResponse.json();
		let modelTokenDataArray = checkedCharacterGroup.map(item => ({
					agent_id: item.id,
					model: item.model,
					token: item.modelTokenPair[item.model],
					data: findModelDataByName(item.model)
				}))
		let modelTokenDataDict = {}
		for (let i=0; i<modelTokenDataArray.length; i++){
			modelTokenDataArray[i].data.args.openAIApiKey = modelTokenDataArray[i].token
			let embedding = embeddingData[0]
			embedding.args.openAIApiKey = modelTokenDataArray[i].token
			modelTokenDataDict[modelTokenDataArray[i].agent_id] = {
				data: modelTokenDataArray[i].data,
				embedding: embedding
			}
		}
		modelTokenDataStore.update(currentData => {
			return JSON.stringify(
				modelTokenDataDict
			);
		});
		if (conversation_id.success) {
			window.location.href = '/room/' + conversation_id.conversation_id;
		} else {
			console.log(conversation_id.error);
		}
	};
</script>

<Label class="mb-8 w-1/2 text-white normal-case">
	<div class="text-2xl">Conversation name</div>
	<Input
		id="name"
		type="text"
		size="lg"
		class="mt-5 bg-stone-950 text-white font-sans"
		placeholder="Type in your conversation name"
		bind:value={chatName}
		required
	/>
</Label>

<div id="globalGrid">
	<div>
		<Label class="mb-8 w-1/2 text-white normal-case">
			<div class="text-2xl">Pick up to 4 agents for the conversation</div>
		</Label>

		<Button size="xl"><Chevron>Agents</Chevron></Button>
		<Dropdown class="overflow-y-auto py-1 h-48 mt-12">
			<div slot="header" class="p-3">
				<Search id="searchBar" placeholder="Search..." bind:value={$searchStore.search} />
			</div>
			{#each $searchStore.filtered as character, i}
				<li class="rounded p-2 hover:bg-gray-300">
					<Checkbox
						disabled={!isAgentSelectable[i]}
						bind:group={checkedCharacterGroup}
						value={character}
						on:change={updateAgentSelectable}
					>
						<Avatar src={character.image} size="md" />
						<div class="ml-4 text-green-950 text-lg">{character.name}</div>
					</Checkbox>
				</li>
			{/each}
		</Dropdown>
	</div>

	<div class="mt-20 flex flex-col">
		{#if checkedCharacterGroup.length > 0}
			<Label class="mb-4 w-1/2 text-white normal-case">
				<div class="text-2xl">Click an icon to configure an agent</div>
			</Label>
		{/if}

		<div class="mb-4">
			<div class="scroller flex flex-row">
				{#each checkedCharacterGroup as character, i}
					<div class="characterInfoSet">
						<Character
							bind:character
							on:message={handleOnClickImageMessage}
							bind:avatarStyle={characters[i].avatarStyle}
						/>
					</div>
				{/each}
			</div>
		</div>

		<div>
			{#if checkedCharacterGroup.length > 0}
				<div>
					<Label class="mb-10 w-1/2">
						<Select
							id="playerDropDown"
							class="mt-5 w-1/3 p-2.5"
							size="lg"
							bind:value={playerCharacterId}
							placeholder="Select an agent to play"
						>
							{#each characterItems as { value, name }}
								<option {value} class="text-black font-semibold">{name}</option>
							{/each}
						</Select>
					</Label>
				</div>
				<div class="mt-4">
					<Button size="xl" on:click={handleCreateButton}>Start the conversation</Button>
				</div>
			{/if}
		</div>
	</div>

	{#if lastClickedCharacterName}
		<div class="mt-12">
			<Label class="mb-8 w-1/2 text-white normal-case">
				<div class="text-3xl mb-8">
					Agent: <span class="text-blue-500">{lastClickedCharacterName}</span>
				</div>
			</Label>
			<Label class="mb-8 w-1/2 text-white normal-case">
				<div class="text-2xl mb-8">Select an LLM Model</div>
				<Select
					id="modelSelect"
					class="font-semibold bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
					placeholder="Select Model"
					bind:value={selectedModel}
					on:change={handleModelChange}
				>
					{#each models as { value, name }}
						<option {value} class="text-black font-semibold">{name}</option>
					{/each}
				</Select>
			</Label>

			<Label class="mb-8 w-1/2 text-white normal-case">
				<div class="text-2xl">Model Token</div>
			</Label>
			<Input
				id="tokenField"
				class="font-semibold"
				placeholder="Type in the model token"
				disabled={!selectedModel}
				on:change={handleTokenInput}
				bind:value={selectedToken}
				size="lg"
			/>
		</div>
	{/if}
</div>
<Toast />

<style>
	#searchBar {
		width: 200px;
	}

	#chatNameField {
		width: 400px;
	}

	.scroller {
		width: 600px;
		height: 500px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(3, 200px);
		grid-template-rows: repeat(auto-fill, 220px);
	}

	#globalGrid {
		display: grid;
		grid-template-rows: 50px 500px;
		grid-auto-flow: column;
		gap: 10px;
		/* grid-auto-columns: 400px 400px; */
	}
</style>
