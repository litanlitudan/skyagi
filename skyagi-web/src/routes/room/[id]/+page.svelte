<script lang="ts">
	import ChatMessage from '$lib/ChatMessage.svelte';
	import CharacterDashboard from '$lib/Character_dashboard.svelte';
	import Input from '$lib/Input.svelte';
	import {
		Button,

	} from 'flowbite-svelte';
	import {
		chatMessages,
		answer,
		currentAgentName,
		conversationId,
		userAgentId,
		agentIds,
		idToAgentInfoMap
	} from '$lib/stores/chat-messages';
	import type { PageData } from './$types';
	import {
		StoreMessageRole,
		type ConversationDataType,
		type MessageDataType,
		type StoreMessageType,
		type AgentDataType,
		type AgentDataTypeInConversation
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

	const isSystemConversationMessage = (
		initiateAgentId: string,
		recipientAgentId: string,
		userAgentId: string
	) => {
		if (initiateAgentId === userAgentId || recipientAgentId === userAgentId) return false;
		return true;
	};

	onMount(() => {
		// if the conversation has history, put the history into local storage.
		conversationId.set(conversationData.id);
		userAgentId.set(conversationData.userAgents[0].id);
		agentIds.set(conversationData.agents.map(agent => agent.id));
		let idToAgentInfoMapDict: { [key: string]: AgentDataTypeInConversation } = {};
		conversationData.agents.forEach(agent => {
			idToAgentInfoMapDict[agent.id] = {
				name: agent.name,
				avatarPath: agent.avatarPath
			};
		});
		idToAgentInfoMap.set(idToAgentInfoMapDict);
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
				if (
					!isSystemConversationMessage(
						message.initiateAgentId,
						message.recipientAgentId,
						userAgentId
					)
				) {
					chatHistoryToLoad[localHistoryKey].push({
						role: getRole(message.initiateAgentId, userAgentId),
						name: agentIdToAgentDataMap[message.initiateAgentId].name,
						content: message.content
					});
				}
			});
			console.log('chatHistoryToLoad', chatHistoryToLoad);
			loadHistoryToLocalStorage(chatHistoryToLoad);
		}
		console.log('Finish loading conversation history');
	});
</script>

<div id="globalGrid">
	<div>
		<CharacterDashboard
			conversationId={conversationData.id}
			userAgent={conversationData.userAgents[0]}
			agents={conversationData.agents.filter(
				agent => agent.id != conversationData.userAgents[0].id
			)}
		/>
	</div>

	<div>
		<div class="bg-gray-800 rounded-md !divide-y-gray-200">
			<div
				class="h-[700px] p-4 overflow-y-auto gap-4"
			>
				<div class="gap-2">
					{#if $chatMessages.messages}
						{#each $chatMessages.messages as message}
							<ChatMessage type={message.role} name={message.name} message={message.content} userAgentName={conversationData.userAgents[0].name} />
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
				class="flex w-full gap-4 p-3 pt-5"
				on:submit|preventDefault={handleSubmit}
			>
				<Input type="text" bind:value={query} class="w-full" />
				<Button
					type="submit"
					class="hover:bg-white/5 px-8 mt-2" size="sm"
				>
					Send
				</Button>
			</form>
		</div>
	</div>
</div>

<style>
	#globalGrid {
		display: grid;
		grid-template-columns: 30% 70%;
		grid-auto-flow: column;
		/* gap: 200px; */
		/* grid-auto-columns: 400px 400px; */
	}
</style>