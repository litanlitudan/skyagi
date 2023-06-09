<script lang="ts">
	import { onMount } from 'svelte';

	import { chatMessages } from '$lib/stores/chat-messages';
	import {
		chatHistory,
		filterHistory,
		chatHistorySubscription,
		loadMessages
	} from './stores/chat-history';

	let chatHistoryKeys: any = [];

	onMount(() => {
		chatHistorySubscription.set($chatHistory);
		chatHistorySubscription.subscribe((value: any) => {
			chatHistoryKeys = Object.keys(value);
		});
	});
</script>

<div
	class="h-[700px] w-[350px] bg-black bg-opacity-20 rounded-md py-4 px-2 overflow-y-auto flex flex-col gap-2"
>
	<button
		on:click={chatMessages.reset}
		class="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/20"
	>
		New chat
	</button>

	{#if chatHistoryKeys.length > 0}
		{#each chatHistoryKeys as message (message)}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				on:click={() => loadMessages(message)}
				class="flex py-3 px-3 items-center gap-3 relative rounded-md cursor-pointer break-all pr-14 bg-opacity-40 hover:bg-white/5 bg-black group animate-flash text-sm"
			>
				<div class="flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative">{message}</div>

				<div class="absolute flex right-1 z-10 text-gray-300 visible">
					<button on:click={() => loadMessages(message)} class="p-1 hover:text-white" />
					<button
						on:click|preventDefault={() => filterHistory(message)}
						class="p-1 hover:text-white"
					/>
				</div>
			</div>
		{/each}
	{/if}
</div>
