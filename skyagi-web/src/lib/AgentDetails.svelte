<script lang="ts">
	import { goto } from '$app/navigation';
	import type { User } from '@supabase/supabase-js';
	import { isAgentFormEditing } from './stores';
	import type { AgentDataType } from './types';
	import { Button, Modal, Avatar } from 'flowbite-svelte';

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
		<h1 class="mb-8 text-5xl">Agent Profile</h1>
		<!-- Display the form data -->
		<div id="globalGrid">
			<div>
				<Avatar src={agentData.avatarPath} size="lg" />
			</div>
			<div>
				<h2 class="text-3xl">Basic information</h2>
				<div id="textGrid" class="my-4">
					<div>Name:</div>
					<div class="text-sky-500">{agentData.name}</div>
					<div>Age:</div>
					<div class="text-sky-500">{agentData.age}</div>
					<div>Personalities:</div>
					<div class="text-sky-500">{agentData.personalities}</div>
					<div>Social status:</div>
					<div class="text-sky-500">{agentData.socialStatus}</div>
				</div>
				{#if agentData.memories}
					<h2 class="text-3xl">Memories</h2>
					<div class="my-4 indent-14">
						<ul>
							{#each agentData.memories as memory}
								<li class="list-disc list-inside text-sky-500 my-2">{memory}</li>
							{/each}
						</ul>
					</div>
				{/if}
				<Button type="button" size="xl" on:click={handleEdit}>Edit</Button>
				<!-- <Button type="button" color="red" on:click={() => (popupDeleteModal = true)}>Delete</Button> -->
			</div>
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
		grid-template-columns: 12% 70%;
		grid-auto-flow: row;
		/* grid-auto-columns: 400px 400px; */
	}

	#textGrid {
		display: grid;
		text-indent: 56px;
		grid-template-columns: 20% 50%;
		grid-auto-flow: row;
		gap: 10px;
	}
</style>
