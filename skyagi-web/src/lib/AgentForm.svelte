<script lang="ts">
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import { Label, Input, Button } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';

	export let agentData: AgentDataType = {
		id: '',
		name: '',
		age: '',
		personalities: '',
		socialStatus: '',
		memories: ['']
	};

	export let user: User;

	async function handleSubmit() {
		if ($isAgentFormEditing) {
			const user_id = user.id;
			const resp = await fetch('/api/update-agent', {
				headers: {
					'Content-Type': 'application/json'
				},
				method: 'PUT',
				body: JSON.stringify({
					agent_id: agentData.id,
					user_id,
					agent: {
						name: agentData.name,
						age: agentData.age,
						personality: agentData.personalities,
						status: agentData.socialStatus,
						memory: agentData.memories.join('\n')
					}
				})
			});
			const data = await resp.json();
			if (!data.success) {
				alert(data.error);
			} else {
				isAgentFormEditing.set(false);
			}
		} else {
			const user_id = user.id;
			const resp = await fetch('/api/create-agent', {
				headers: {
					'Content-Type': 'application/json'
				},
				method: 'PUT',
				body: JSON.stringify({
					user_id,
					agent: {
						name: agentData.name,
						age: agentData.age,
						personality: agentData.personalities,
						status: agentData.socialStatus,
						memory: agentData.memories.join(' ')
					}
				})
			});

			const data = await resp.json();
			if (!data.success) {
				alert(data.error);
			} else {
				goto(`/agent/${data.agent_id}`);
			}
		}
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
			<Input id="name" type="text" class="mt-5" bind:value={agentData.name} />
		</Label>

		<Label for="age" class="mb-8 w-1/4">
			Age:
			<Input id="age" type="number" class="mt-5" bind:value={agentData.age} />
		</Label>

		<Label for="personalities" class="mb-8 w-1/4">
			Personalities:
			<Input id="personalities" type="text" class="mt-5" bind:value={agentData.personalities} />
		</Label>

		<Label for="social-status" class="mb-8 w-1/4">
			Social status:
			<Input id="social-status" type="text" class="mt-5" bind:value={agentData.socialStatus} />
		</Label>

		<Label for="memories" class="mb-10 w-1/2">
			Memories:

			{#each agentData.memories as memory, index}
				<div class="mb-5 mt-5 flex">
					<Input
						id="memories"
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
			<Button type="button" class="" color="light" on:click={() => isAgentFormEditing.set(false)}
				>Cancel</Button
			>
		{/if}
		<Button type="submit" class="">Submit</Button>
	</form>
</main>
