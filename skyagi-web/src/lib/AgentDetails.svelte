<script lang="ts">
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import { Button, Modal } from 'flowbite-svelte';

	export let agentData: AgentDataType;

	export let user: User;

	let popupDeleteModal = false;

	function handleEdit() {
		isAgentFormEditing.set(true);
	}

	export let handleDelete = async () => {
		const agent_id = agentData.id;
		const user_id = user.id;

		const resp = await fetch('/api/archive-agent', {
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'PUT',
			body: JSON.stringify({ agent_id, user_id })
		});

		goto('/dashboard');
	};
</script>

<main>
	{#if agentData && Object.keys(agentData).length !== 0 && !agentData.archived}
		<h1>Agent Details</h1>
		<!-- Display the form data -->
		<p>Name: {agentData.name}</p>
		<p>Age: {agentData.age}</p>
		<p>Personalities: {agentData.personalities}</p>
		<p>Social status: {agentData.socialStatus}</p>
		<p>Memories:</p>
		{#if agentData.memories}
			<ul>
				{#each agentData.memories as memory}
					<li>{memory}</li>
				{/each}
			</ul>
		{/if}
		<Button type="button" on:click={handleEdit}>Edit</Button>
		<Button type="button" color="red" on:click={() => (popupDeleteModal = true)}>Delete</Button>
	{:else}
		<p>Agent not found</p>
	{/if}

	<Modal bind:open={popupDeleteModal} size="xs" autoclose>
		<div class="text-center">
			<svg
				aria-hidden="true"
				class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
				Are you sure you want to delete this agent?
			</h3>
			<Button color="red" class="mr-2" on:click={handleDelete}>Yes, I'm sure</Button>
			<Button color="alternative">No, cancel</Button>
		</div>
	</Modal>
</main>
