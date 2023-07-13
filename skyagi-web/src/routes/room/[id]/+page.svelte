<script lang="ts">
	import ChatMessage from '$lib/ChatMessage.svelte';
	import CharacterDashboard from '$lib/Character_dashboard.svelte';
	import Input from '$lib/Input.svelte';
	import {
		chatMessages,
		answer,
		currentAgentName,
		conversationId,
		userAgentId
	} from '$lib/stores/chat-messages';
	import type { PageData } from './$types';
	import {
		StoreMessageRole,
		type ConversationDataType,
		type MessageDataType,
		type StoreMessageType,
		type AgentDataType
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { loadHistoryToLocalStorage, getLocalHistoryKey } from '$lib/stores/chat-history';
	import { get } from 'svelte/store';

	export let data: PageData;

	let query = '';
	let conversationData: ConversationDataType = data.body;

	const handleSubmit = async () => {
		answer.set('...');
		await chatMessages.set(query);
		query = '';
	};

	const getAgentIdForChat = (message: MessageDataType, userAgentId: string): string => {
		if (message.recipientAgentId === userAgentId) return message.initiateAgentId;
		return message.recipientAgentId;
	};

	const getRole = (initiateAgentId: string, userAgentId: string): StoreMessageRole => {
		if (initiateAgentId === userAgentId) return StoreMessageRole.USER_AGENT;
		return StoreMessageRole.AGENT;
	};

	const getAgentIdToAgentDataMap = (agentDataLists: AgentDataType[]) => {
		let agentIdToAgentDataMap: { [key: string]: AgentDataType } = {};
		agentDataLists.forEach(agentData => {
			if (!agentIdToAgentDataMap[agentData.id]) agentIdToAgentDataMap[agentData.id] = agentData;
		});
		return agentIdToAgentDataMap;
	};

	onMount(() => {
		// if the conversation has history, put the history into local storage.
		conversationId.set(conversationData.id);
		userAgentId.set(conversationData.userAgents[0].id);
		console.log('conversationData', conversationData);
		console.log('Start loading conversation history');
		if (conversationData.messages && conversationData.messages.length > 0) {
			console.log('in the middle of loading conversation history');
			let chatHistoryToLoad: { [key: string]: StoreMessageType[] } = {};
			const conversationId = conversationData.id;
			const userAgentId = conversationData.userAgents[0].id;
			const agentIdToAgentDataMap = getAgentIdToAgentDataMap(
				conversationData.agents.concat(conversationData.userAgents)
			);
			conversationData.messages.forEach(message => {
				const localHistoryKey = getLocalHistoryKey(
					conversationId,
					getAgentIdForChat(message, userAgentId)
				);
				if (!chatHistoryToLoad[localHistoryKey]) chatHistoryToLoad[localHistoryKey] = [];
				chatHistoryToLoad[localHistoryKey].push({
					role: getRole(message.initiateAgentId, userAgentId),
					name: agentIdToAgentDataMap[message.initiateAgentId].name,
					content: message.content
				});
			});
			console.log('chatHistoryToLoad', chatHistoryToLoad);
			loadHistoryToLocalStorage(chatHistoryToLoad);
		}
		console.log('Finish loading conversation history');
	});
</script>

<section class="flex max-w-6xl w-full pt-4 justify-center">
	<div class="flex flex-col gap-2">
		<CharacterDashboard
			conversationId={conversationData.id}
			userAgent={conversationData.userAgents[0]}
			agents={conversationData.agents.filter(
				agent => agent.id != conversationData.userAgents[0].id
			)}
		/>
	</div>

	<div class="flex flex-col w-full px-8 items-center gap-2">
		<div
			class="h-[700px] w-full bg-black bg-opacity-20 rounded-md p-4 overflow-y-auto flex flex-col gap-4"
		>
			<div class="flex flex-col gap-2">
				{#if $chatMessages.messages}
					{#each $chatMessages.messages as message}
						<ChatMessage type={message.role} name={message.name} message={message.content} />
					{/each}
				{/if}

				{#if $answer}
					<ChatMessage
						type={StoreMessageRole.AGENT}
						name={get(currentAgentName)}
						message={$answer}
					/>
				{/if}
			</div>
		</div>
		<form
			class="flex w-full rounded-md gap-4 bg-black bg-opacity-20 p-2"
			on:submit|preventDefault={handleSubmit}
		>
			<Input type="text" bind:value={query} class="w-full" />
			<button
				type="submit"
				class="bg-black bg-opacity-40 hover:bg-white/5 px-8 py-1.5 border border-black/40 ml-[-0.5rem] rounded-md text-teal-300"
			>
				Send
			</button>
		</form>
	</div>
</section>
