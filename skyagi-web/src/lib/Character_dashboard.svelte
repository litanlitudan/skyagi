<script lang="ts">
	import type { CharacterType } from './types';
	import Character from './Character.svelte';
	import { onMount } from 'svelte';
	import {
		chatHistory,
		filterHistory,
		chatHistorySubscription,
		loadMessages
	} from './stores/chat-history';
	import Icon1 from '$lib/assets/Avatar1.png';
	import Icon2 from '$lib/assets/Avatar2.png';
	import Icon3 from '$lib/assets/Avatar3.png';

	// Define the list of characters
	let character1: CharacterType = {
		image: Icon1,
		name: 'Penny',
		title: 'Waitress',
		description: 'Description of character 1.'
	};
	let characters: CharacterType[] = [
		{
			image: Icon2,
			name: 'Sheldon',
			title: 'Theoretical Scientist',
			description: 'Description of character 2.'
		},
		{
			image: Icon3,
			name: 'Leonard',
			title: 'Experimental Physicist',
			description: 'Description of character 2.'
		},
		{
			image: Icon1,
			name: 'Amy',
			title: 'Receptionist',
			description: 'Description of character 2.'
		}
	];

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
				<Character character={character1} />
			</div>
			<div class="w-60">
				<h1 class="mb-2 text-2xl">Agents</h1>
				{#if chatHistoryKeys.length > 0}
					{#each chatHistoryKeys as message, i}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div on:click={() => loadMessages(message)}>
							<Character character={characters[i]} />
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
</style>
