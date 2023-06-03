<script lang="ts">
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import { Label, Input, Button } from 'flowbite-svelte';

	export let agentData: AgentDataType = {
		id: '',
		name: '',
		age: '',
		personalities: '',
		socialStatus: '',
		memories: ['']
	};

	function handleSubmit() {
		console.log('submitted!');
		isAgentFormEditing.set(false);
	}

	function addMemory() {
		agentData.memories = [...agentData.memories, ''];
	}

	function updateMemory(index: number, event: Event) {
		agentData.memories[index] = (event.target as HTMLInputElement).value;
		agentData.memories = [...agentData.memories];
	}

	function removeMemory(index: number) {
		agentData.memories.splice(index, 1);
		agentData.memories = [...agentData.memories];
	}
</script>

<main>
	<form on:submit|preventDefault={handleSubmit}>
		<Label class="mb-8 w-1/4">
			Name:
			<Input type="text" class="mt-5" bind:value={agentData.name} />
		</Label>

		<Label class="mb-8 w-1/4">
			Age:
			<Input type="number" class="mt-5" bind:value={agentData.age} />
		</Label>

		<Label class="mb-8 w-1/4">
			Personalities:
			<Input type="text" class="mt-5" bind:value={agentData.personalities} />
		</Label>

		<Label class="mb-8 w-1/4">
			Social status:
			<Input type="text" class="mt-5" bind:value={agentData.socialStatus} />
		</Label>

		<Label class="mb-10 w-1/2">
			Memories:

			{#each agentData.memories as memory, index}
				<div class="mb-5 mt-5 flex">
					<Input
						type="text"
						class="mr-2 dark:placeholder-gray-500"
						placeholder="Social relationship, experience, catch phrase, ..."
						bind:value={memory}
						on:input={event => updateMemory(index, event)}
					/>
					<Button type="button" color="red" on:click={() => removeMemory(index)} class="">-</Button>
				</div>
			{/each}

			<Button type="button" on:click={addMemory}>+</Button>
		</Label>

		{#if $isAgentFormEditing}
			<Button type="button" class="" on:click={() => isAgentFormEditing.set(false)}>Cancel</Button>
		{/if}
		<Button type="submit" class="">Submit</Button>
	</form>
</main>
