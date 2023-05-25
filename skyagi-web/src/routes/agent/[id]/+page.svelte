<script lang="ts">
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	let agentData: AgentDataType = data.body;
</script>

<AgentForm {agentData} />
