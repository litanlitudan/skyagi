<script lang="ts">
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import {
		Button,
		Modal,
		Avatar,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

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
		<div id="globalGrid">
			<Table color="gray">
				<TableBody>
					<TableBodyRow>
						<div class="text-zinc-400 text-xl font-extrabold my-4 font-mono">Profile picture</div>
						<div class="mb-4"><Avatar src={agentData.avatarPath} size="lg" /></div>
					</TableBodyRow>
					<TableBodyRow>
						<div class="text-zinc-400 text-xl font-extrabold mt-4 font-mono">Name</div>
						<div class="text-white text-xl font-extrabold mb-4 font-mono">{agentData.name}</div>
					</TableBodyRow>
					<TableBodyRow>
						<div class="text-zinc-400 text-xl font-extrabold mt-4 font-mono">Age</div>
						<div class="text-white text-xl font-extrabold mb-4 font-mono">{agentData.age}</div>
					</TableBodyRow>
					<TableBodyRow>
						<div class="text-zinc-400 text-xl font-extrabold mt-4 font-mono">Personality</div>
						<div class="text-white text-xl font-extrabold mb-4 font-mono">
							{agentData.personalities}
						</div>
					</TableBodyRow>
					<TableBodyRow>
						<div class="text-zinc-400 text-xl font-extrabold mt-4 font-mono">Social status</div>
						<div class="text-white text-xl font-extrabold mb-4 font-mono">
							{agentData.socialStatus}
						</div>
					</TableBodyRow>
					<TableBodyRow>
						{#if agentData.memories}
							<div class="text-zinc-400 text-xl font-extrabold mt-2 font-mono">Memory</div>

							<div class="my-4">
								<ul>
									{#each agentData.memories as memory}
										<li class="text-xl text-white text-left font-mono my-6">
											{memory}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</TableBodyRow>
					<TableBodyRow>
						<div class="my-2">
							<Button type="button" color="dark" size="xl" on:click={handleEdit}>Edit Agent</Button>
						</div>
					</TableBodyRow>
				</TableBody>
			</Table>
		</div>
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

<style>
	main {
		font-size: 25px;
	}

	#globalGrid {
		display: grid;
		grid-template-columns: 70%;
		grid-auto-flow: row;
		/* grid-auto-columns: 400px 400px; */
	}
</style>
