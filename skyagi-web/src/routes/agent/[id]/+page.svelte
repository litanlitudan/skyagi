<script lang="ts">
	import AgentDetailsNew from '$lib/AgentDetailsNew.svelte';
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import type { PageData } from './$types';
	import { isAgentFormEditing } from '$lib/stores';
	import type { User } from '@supabase/supabase-js';
	import Error from '$lib/Error.svelte';

	export let data: PageData;

	let agentData: AgentDataType = data.body;
	let user: User = data.user;
	let error = data.error;
</script>


<AgentDetailsNew {agentData} {user} />


{#if agentData == null && error}
	<Error errorCode={error.errorCode} errorName={error.errorName} errorMsg={error.errorMsg} />
{/if}
