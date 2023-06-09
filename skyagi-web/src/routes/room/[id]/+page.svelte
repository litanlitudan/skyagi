<script lang="ts">
	import ChatHistory from '$lib/ChatHistory.svelte';
	import ChatMessage from '$lib/ChatMessage.svelte';
	import CharacterDashboard from '$lib/Character_dashboard.svelte';
	import Input from '$lib/Input.svelte';
	import { chatMessages, answer } from '$lib/stores/chat-messages';
	import { onMount } from 'svelte';

	let query = '';

	const handleSubmit = async () => {
		answer.set('...');
		await chatMessages.set(query);
		query = '';
	};

	onMount(async () => {
		fetch('https://app.skyagi.ai/api/get-conversation', {
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'PUT',
			body: JSON.stringify({
				conversation_id: '6f74a64d-22a2-4472-a969-2b6851c6d4e1'
			})
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
			})
			.catch(error => {
				console.log(error);
			});
	});
</script>

<section class="flex max-w-6xl w-full pt-4 justify-center">
	<div class="flex flex-col gap-2">
		<CharacterDashboard />
	</div>

	<div class="flex flex-col w-full px-8 items-center gap-2">
		<div
			class="h-[700px] w-full bg-black bg-opacity-20 rounded-md p-4 overflow-y-auto flex flex-col gap-4"
		>
			<div class="flex flex-col gap-2">
				{#each $chatMessages.messages as message}
					<ChatMessage type={message.role} message={message.content} />
				{/each}

				{#if $answer}
					<ChatMessage type="assistant" message={$answer} />
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
