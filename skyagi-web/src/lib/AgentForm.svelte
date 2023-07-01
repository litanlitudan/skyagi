<script lang="ts">
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import {
		Label,
		Input,
		Button,
		Helper,
		Chevron,
		Dropdown,
		Avatar,
		DropdownItem
	} from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';
	import { globalAvatarImageList } from '$lib/stores.js';

	export let agentData: AgentDataType = {
		id: '',
		name: '',
		age: '',
		personalities: '',
		socialStatus: '',
		memories: ['', '', '', '', ''],
		avatarPath: ''
	};

	export let user: User;

	const minMemories = 5;

	let showError = false;

	function validate(agentForm: AgentDataType) {
		for (let index = 0; index < minMemories; index++) {
			if (agentForm.memories[index] == '') {
				return false;
			}
		}
		return true;
	}

	async function handleSubmit() {
		if (validate(agentData)) {
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
							memory: agentData.memories.join('\n'),
							avatar: {
								cloud_path: '',
								local_path: agentData.avatarPath
							}
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
							memory: agentData.memories.join('\n'),
							avatar: {
								cloud_path: '',
								local_path: agentData.avatarPath
							}
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
		} else {
			showError = true;
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

	function handleAvatarClick(inputPath: string) {
		agentData.avatarPath = inputPath;
	}
</script>

<main>
	<form on:submit|preventDefault={handleSubmit}>
		<Label for="avatar-path" class="mb-8 w-1/4 text-white">
			<div class="text-lg mb-2">Profile Picture:</div>
			<div>
				<Button id="avatar-path">
					<Avatar src={agentData.avatarPath} size="lg" rounded />
				</Button>
				<Dropdown class="w-48 overflow-y-auto py-1 h-48">
					{#each globalAvatarImageList as avatarImage, i}
						<DropdownItem
							class="flex items-center text-base font-semibold gap-2"
							on:click={() => handleAvatarClick(avatarImage)}
						>
							<Avatar src={avatarImage} size="lg" rounded />
						</DropdownItem>
					{/each}
				</Dropdown>
			</div>
		</Label>

		<Label class="mb-8 w-1/4 text-white">
			<div class="text-lg">Name:</div>
			<Input id="name" type="text" class="mt-5" bind:value={agentData.name} />
		</Label>

		<Label for="age" class="mb-8 w-1/4 text-white">
			<div class="text-lg">Age:</div>
			<Input id="age" type="number" class="mt-5" bind:value={agentData.age} />
		</Label>

		<Label for="personalities" class="mb-8 w-1/4 text-white">
			<div class="text-lg">Personalities:</div>
			<Input id="personalities" type="text" class="mt-5" bind:value={agentData.personalities} />
		</Label>

		<Label for="social-status" class="mb-8 w-1/4 text-white">
			<div class="text-lg">Social status:</div>
			<Input id="social-status" type="text" class="mt-5" bind:value={agentData.socialStatus} />
		</Label>

		<Label for="memories" class="mb-10 w-1/2 text-white">
			<div class="text-lg">Memories:</div>
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
					{#if showError && memory === ''}
						<Helper class="mt-2" color="red">This entry should not be empty</Helper>
					{/if}

					{#if index + 1 > minMemories}
						<Button type="button" color="red" on:click={() => removeMemory(index)} class=""
							>-</Button
						>
					{/if}
				</div>
			{/each}

			<Button type="button" size="xl" on:click={addMemory}>+</Button>
		</Label>

		{#if $isAgentFormEditing}
			<Button type="button" class="" color="light" on:click={() => isAgentFormEditing.set(false)}
				>Cancel</Button
			>
		{/if}
		<Button type="submit" size="xl">Submit</Button>
	</form>
</main>
