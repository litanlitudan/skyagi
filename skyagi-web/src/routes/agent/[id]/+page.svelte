<script lang="ts">
	import AgentDetails from '$lib/AgentDetails.svelte';
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import type { PageData } from './$types';
	import { isAgentFormEditing } from '$lib/stores';

	export let data: PageData;

	let agentData: AgentDataType = data.body;
</script>

{#if $isAgentFormEditing}
	<AgentForm {agentData} />
{:else}
	<AgentDetails {agentData} />
{/if}
