<script lang="ts">
	import Character from '$lib/room-new-character.svelte';
	import { Input, Select, Label, Button } from 'flowbite-svelte';
	export let data;
	import { browser } from '$app/environment';
	import Error from '$lib/Error.svelte';
	export const conversationId = data.conversation_id;
	export const user = data.user;
	export const userId = data.userId;
	export const agentData = data.agentData;
	export const agentIds = data.agentIds;
	export const userAgentIds = data.userAgentIds;
	export const userAgentNames = data.userAgentNames;
	export const modelData = data.models;
	export const embeddingData = data.embeddings;
	export const chatName = data.chatName;
	export const messages = data.messages;
	let error = data.error;

	import modelTokenDataStore from '$lib/room-store.js';
	import { globalAvatarImageList } from '$lib/stores.js';

	let models = modelData;
	import preSavedModelTokenDataStore from '$lib/token-store.js';
	let preSavedModelTokenDataIsEmpty = $preSavedModelTokenDataStore.length == 0;
	export let modelTokenPair = modelData.map(item => ({
		[item.name]: ''
	}));
	let preSavedModelTokenData = $preSavedModelTokenDataStore;
	if ((preSavedModelTokenDataIsEmpty || preSavedModelTokenDataStore == null) !== true) {
		let tempModelTokenData = JSON.parse(preSavedModelTokenData);
		modelTokenPair = {};
		for (let i = 0; i < tempModelTokenData.length; i++) {
			modelTokenPair[tempModelTokenData[i].model] = tempModelTokenData[i].token;
		}
	}

	let characters = agentData.map(function (characterDataPoint) {
		let imagePath = '/assets/Avatar1.png';
		if (
			characterDataPoint.avatar != null &&
			globalAvatarImageList.includes(characterDataPoint.avatar.local_path)
		) {
			imagePath = characterDataPoint.avatar.local_path;
		}
		return {
			...characterDataPoint,
			image: imagePath,
			model: models[0].value,
			modelTokenPair: { ...modelTokenPair },
			avatarStyle: 'rounded-lg border-none border-4 hover:border-solid border-indigo-600'
		};
	});

	let lastClickedCharacterName = characters[0].name;
	let lastClickedCharacter = characters[0];
	characters[0].avatarStyle =
		'rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600';
	let showedModelValue = models[0].value;
	let showedTokenValue = modelTokenPair[models[0].value];
	function handleOnClickImageMessage(event) {
		lastClickedCharacterName = event.detail.character.name;
		lastClickedCharacter = event.detail.character;
		showedModelValue = event.detail.character.model;
		showedTokenValue = event.detail.character.modelTokenPair[showedModelValue];
		for (let i = 0; i < characters.length; i++) {
			if (characters[i].name == lastClickedCharacterName) {
				characters[i].avatarStyle =
					'rounded-lg border-solid border-4 hover:border-solid hover:border-indigo-600 border-indigo-600';
			} else {
				characters[i].avatarStyle =
					'rounded-lg border-none border-4 hover:border-solid border-indigo-600';
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
	}

	let selectedModel = models[0].value;
	let savedTokenValue = modelTokenPair[models[0].value];
	let selectedToken = '';
	if (savedTokenValue && savedTokenValue !== '') {
		selectedToken = savedTokenValue;
	}

	let playerCharacterId = '';
	function charactersToItems(inputCharacters) {
		let rst = [];
		for (let i = 0; i < inputCharacters.length; i++) {
			rst.push({ name: inputCharacters[i].name, value: inputCharacters[i].id });
		}
		return rst;
	}

	function handleModelChange() {
		lastClickedCharacter.model = selectedModel;
		selectedToken = lastClickedCharacter.modelTokenPair[selectedModel];
	}

	function handleTokenInput() {
		lastClickedCharacter.modelTokenPair[selectedModel] = selectedToken;
	}
	let createDisabled = true;
	function checkCreateButtonDisabled(inputCharacters, inputChatName, inputPlayerCharacter) {
		for (let i = 0; i < inputCharacters.length; i++) {
			if (
				inputCharacters[i].model == '' ||
				inputCharacters[i].modelTokenPair[inputCharacters[i].model] == ''
			) {
				return true;
			}
		}
		if (inputPlayerCharacter == '') {
			return true;
		}
		return false;
	}
	function findModelDataByName(modelName) {
		let dataPoint = modelData.find(item => item.name == modelName);
		return dataPoint.data;
	}
	$: createDisabled = checkCreateButtonDisabled(characters, chatName, playerCharacterId);
	const handleCreateButton = async () => {
		let modelTokenDataArray = characters.map(item => ({
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
		window.location.href = '/room/' + conversationId;
	};
</script>

<Label class="mb-8 w-1/2 text-white normal-case">
	<div class="h-4 text-gray-200 text-2xl mt-3">{chatName}</div>
</Label>

<div id="globalGrid">
	<div>
		<div class="h-4 text-zinc-500 text-lg font-light" id="profileText">
			Select an agent and specify his/her LLM info
		</div>
		<div class="scroller">
			{#each characters as character, i}
				<div class="characterInfoSet">
					<Character
						bind:character
						on:message={handleOnClickImageMessage}
						bind:avatarStyle={characters[i].avatarStyle}
					/>
				</div>
			{/each}
		</div>

		<div>
			<div>
				<Label class="mb-10 w-1/2 test-white normal-case">
					<div class="h-4 text-zinc-500 text-lg font-light">
						You will be playing
					</div>
					<div class="h-4 text-gray-200 text-xl mt-3">
						{userAgentNames[0]}
					</div>
				</Label>
			</div>
			<div class="mt-4">
				<Button size="xl" on:click={handleCreateButton}>Resume Conversation</Button>
			</div>
		</div>
	</div>

	<div>
		<Label class="mb-8 w-1/2 text-white normal-case">
			<div class="h-4 text-zinc-500 text-lg font-light">
				Agent
			</div>
			<div class="h-4 text-gray-200 text-xl mt-3">{lastClickedCharacterName}</div>
		</Label>
		<Label class="mb-8 w-1/2 text-white normal-case">
			<div class="text-zinc-500 text-lg font-light">Select an LLM Model</div>
			<Select
				id="modelSelect"
				defaultClass='mt-2 h-12 font-semibold text-base text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
				placeholder="Select Model"
				bind:value={selectedModel}
				on:change={handleModelChange}
			>
				{#each models as { value, name }}
					<option {value} class="text-black font-semibold text-lg">{name}</option>
				{/each}
			</Select>
		</Label>

		<Label class="mb-8 w-1/2 text-white normal-case">
			<div class="text-zinc-500 text-lg font-light h-1">Model Token</div>
		</Label>
		<Input
			id="tokenField"
			class="font-base"
			placeholder="Type in the model token"
			disabled={!selectedModel}
			on:change={handleTokenInput}
			bind:value={selectedToken}
			size="lg"
		/>
	</div>
</div>
{#if error}
	<Error errorCode={error.errorCode} errorName={error.errorName} errorMsg={error.errorMsg} />
{/if}

<style>
	.scroller {
		width: 600px;
		height: 400px;
		top: 20px;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(3, 150px);
		grid-template-rows: repeat(auto-fill, 220px);
	}

	#globalGrid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-auto-flow: column;
		gap: 10px;
		margin-top: 40px;
	}
</style>
