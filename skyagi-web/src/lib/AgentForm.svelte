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
		DropdownItem,

		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,

		Hr



	} from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';
	import { globalAvatarImageList } from '$lib/stores.js';
	import Error from '$lib/Error.svelte';

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
	let popUpError = false;
	let errorCode = 1;
	let errorMsg = '';
	let errorName = '';

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
					popUpError = true;
					errorCode = data.status;
					errorName = 'Agent Error';
					errorMsg = data.error;
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
					popUpError = true;
					errorCode = data.status;
					errorName = 'Agent Error';
					errorMsg = data.error;
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
<html class="dark" lang="en">
<main>
	<div id="globalGrid">

		<form on:submit|preventDefault={handleSubmit}>
			<div id="outerColor" class="bg-gray-800 rounded-lg">
				<div id="innerTable" class="bg-gray-800 rounded-lg m-10">
					<div>
						<Label for="avatar-path" class="mb-8 w-1/4 text-white">
							<div>
								<div class="profileContainer">
									<Avatar src={agentData.avatarPath} size="lg" />
									<div id="profileButton">
										<div class="text-sm" id="profileText">Profile Picture</div>
										<Button size="xs" class="!text-sm font-normal" id="profileButton">Change</Button>
									</div>
								</div>
								
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
					</div>
					<hr class="border-zinc-500">
						<div>
							<div class="h-4 text-zinc-500 text-sm" id="profileText">Name:</div>
							<input id="name" type="text" class="text-gray-200 relative right-3 h-4 text-lg font-light bg-transparent border-0 focus:ring-0" bind:value={agentData.name} />
						</div>
					<hr class="border-zinc-500">
					<div>
						<div class="h-4 text-zinc-500 text-sm" id="profileText">Age:</div>
						<input id="age" type="number" class="text-gray-200 relative right-3 h-6 text-lg font-light bg-transparent border-0 focus:ring-0" bind:value={agentData.age} />
					</div>
					<hr class="border-zinc-500">
					<div>
						<div class="h-4 text-zinc-500 text-sm" id="profileText">Personalities:</div>
						<input id="personalities" type="text" class="text-gray-200 relative right-3 h-6 text-lg font-light bg-transparent border-0 focus:ring-0" bind:value={agentData.personalities} />
					</div>
					<hr class="border-zinc-500">
					<div>
						<div class="h-4 text-zinc-500 text-sm" id="profileText">Social status:</div>
						<input id="social-status" type="text" class="text-gray-200 relative right-3 h-6 text-lg font-light bg-transparent border-0 focus:ring-0" bind:value={agentData.socialStatus} />
					</div>
					<hr class="border-zinc-500">
					<div>
						<div class="h-4 text-zinc-500 text-sm" id="profileText">Memories:</div>
						{#each agentData.memories as memory, index}
							<div class="mb-5 mt-5 flex">
								<input
									id="memories"
									type="text"
									class="text-gray-200 relative right-3 h-6 mr-2 text-lg font-light bg-transparent border-0 focus:ring-0"
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
						
						<Button type="button" size="sm" on:click={addMemory}>+</Button>
					</div>
					<div class="pt-10">
						<Button type="button" size="lg" class="" color="light" on:click={() => window.location.href = '/agent/'+agentData.id}
							>Discard</Button
						>
						<Button type="submit" size="lg">Confirm</Button>
					</div>
			
				</div>
				
			</div>
		
		</form>
	</div>

	<Error {popUpError} {errorName} {errorCode} {errorMsg} />
</main>
<style>
	main {
		font-size: 25px;
	}
	.profileContainer {
		display: grid;
		align-items: center; 
		grid-template-columns: 1.5fr 2fr;
		column-gap: 5px;
	}
	#profileText {
		text-transform: none;
		/* margin-left: 10px; */
	}
	#profileButton {
		display: grid;
		justify-items: start;
		grid-template-rows: 0.9fr 0.05fr;
		/* position: fixed;
		top: 50%; */
	}
	#globalGrid {
		display: grid;
		grid-template-columns: 70%;
		grid-auto-flow: row;
		justify-content: center;
		/* grid-auto-columns: 400px 400px; */
	}
	#formGrid {
		display: grid;
		grid-template-columns: 60%;
		margin-top: 50px;
		grid-auto-flow: row;
		justify-content: center;
		grid-row-gap:0px;
		/* grid-auto-columns: 400px 400px; */
	}
	#outerColor {
		display: grid;
		grid-template-columns: 100%;
		grid-auto-flow: row;
		justify-content: center;
		/* grid-auto-columns: 400px 400px; */
	}
	#innerTable {
		display: grid;
		grid-template-columns: 100%;
		grid-auto-flow: row;
		justify-content: center;
		grid-row-gap: 12px;
		/* grid-auto-columns: 400px 400px; */
	}
	/* .field {
		display: grid;
		grid-template-columns: 100%;
		grid-auto-flow: row;
	} */
</style>
</html>