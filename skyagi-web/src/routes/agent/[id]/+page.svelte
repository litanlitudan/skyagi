<script lang="ts">
	import AgentDetails from '$lib/AgentDetails.svelte';
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import type { PageData } from './$types';
	import { isAgentFormEditing } from '$lib/stores';
	import type { User } from '@supabase/supabase-js';

	export let data: PageData;

	let agentData: AgentDataType = data.body;
	let user: User = data.user;
</script>

{#if $isAgentFormEditing}
	<AgentForm {agentData} {user} />
{:else}
	<AgentDetails {agentData} {user} />
{/if}
