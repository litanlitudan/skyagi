<script lang="ts">
	import AgentDetails from '$lib/AgentDetails.svelte';
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	let agentData: AgentDataType = data.body;

	let isEditing = false;

	function handleEdit() {
		isEditing = true;
	}

	function handleSubmit() {
		isEditing = false;
	}
</script>

{#if isEditing}
	<AgentForm {agentData} {handleSubmit} />
{:else}
	<AgentDetails {agentData} {handleEdit} />
{/if}
