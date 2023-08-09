<script lang="ts">
	import type { AgentDataType } from './types';
	import Character from './Character.svelte';
	import { onMount } from 'svelte';
	import { chatHistory, chatHistorySubscription, loadMessages } from './stores/chat-history';
	import Input from './Input.svelte';

	// Define the list of characters
	export let conversationId: string;
	export let userAgent: AgentDataType;
	export let agents: AgentDataType[];

	let chatHistoryKeys: any = [];
	let lastClickedAgentId = "";
	onMount(() => {
		chatHistorySubscription.set($chatHistory);
		chatHistorySubscription.subscribe((value: any) => {
			chatHistoryKeys = Object.keys(value);
		});
	});

	function clickHandle(inputData, agentName, agentId){
		loadMessages(inputData, agentName, agentId)
		lastClickedAgentId=agentId
	}
	
</script>

<div>
	<div class="col-span-2 h-150">
		<div class="flex flex-col gap-20">
			<div class="w-80 h-20 mb-10">
				<h1 class="mb-2 text-xl font-light">Me</h1>
				<Character character={userAgent} isPlayer={true}/>
			</div>
			<div class="w-80">
				<h1 class="mb-2 text-xl font-light">Agents</h1>
				{#if agents.length > 0}
					{#each agents as agent, i}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div class=""
							on:click={() => clickHandle(`${conversationId}+${agent.id}`, agent.name, agent.id)}
						>
							<Character character={agent} isPlayer={false} bind:lastClickedAgentId={lastClickedAgentId}/>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
</style>
