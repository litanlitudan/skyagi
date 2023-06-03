<script lang="ts">
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import { Button } from 'flowbite-svelte';

	export let agentData: AgentDataType;

	function handleEdit() {
		isAgentFormEditing.set(true);
	}

	export let handleDelete = async () => {
		const agent_id = agentData.id;
		// TODO: get user_id
		const user_id = '';

		const resp = await fetch('/api/archive-agent', {
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'PUT',
			body: JSON.stringify({ agent_id, user_id })
		});
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
		<Button type="button" color="red" on:click={handleDelete}>Delete</Button>
	{:else}
		<p>Agent not found</p>
	{/if}
</main>
