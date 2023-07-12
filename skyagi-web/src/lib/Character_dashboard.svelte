<script lang="ts">
	import type { AgentDataType } from './types';
	import Character from './Character.svelte';
	import { onMount } from 'svelte';
	import { chatHistory, chatHistorySubscription, loadMessages } from './stores/chat-history';

	// Define the list of characters
	export let conversationId: string;
	export let userAgent: AgentDataType;
	export let agents: AgentDataType[];

	let chatHistoryKeys: any = [];

	onMount(() => {
		chatHistorySubscription.set($chatHistory);
		chatHistorySubscription.subscribe((value: any) => {
			chatHistoryKeys = Object.keys(value);
		});
	});
</script>

<div>
	<div class="col-span-2 h-150">
		<div class="flex flex-col gap-20">
			<div class="w-60 h-20">
				<h1 class="mb-2 text-2xl">Me</h1>
				<Character character={userAgent} />
			</div>
			<div class="w-60">
				<h1 class="mb-2 text-2xl">Agents</h1>
				{#if agents.length > 0}
					{#each agents as agent}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div
							on:click={() => loadMessages(`${conversationId}+${agent.id}`, agent.name, agent.id)}
						>
							<Character character={agent} />
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
</style>
