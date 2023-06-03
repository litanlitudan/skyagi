<script lang="ts">
	import type { AgentDataType } from './types';
	import { Button } from 'flowbite-svelte';

	export let agentData: AgentDataType;

	export let handleEdit = () => {
		console.log('Edited');
	};

	export let handleDelete = () => {
		console.log('Deleted');
	};
</script>

<main>
	<h1>Agent Details</h1>

	{#if agentData}
		<!-- Display the form data -->
		<p>Name: {agentData.name}</p>
		<p>Age: {agentData.age}</p>
		<p>Personalities: {agentData.personalities}</p>
		<p>Social status: {agentData.socialStatus}</p>
		<p>Memories:</p>
		<ul>
			{#each agentData.memories as memory}
				<li>{memory}</li>
			{/each}
		</ul>
	{:else}
		<p>Loading agent details...</p>
	{/if}

	<Button type="button" on:click={handleEdit}>Edit</Button>
	<Button type="button" color="red" on:click={handleDelete}>Delete</Button>
</main>
