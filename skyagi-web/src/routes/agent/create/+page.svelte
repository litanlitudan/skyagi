<script lang="ts">
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';
	import { _createAgent } from './+page';

	const handleSubmit = async (agentData: AgentDataType) => {
		_createAgent(agentData);
	};
</script>

<AgentForm {handleSubmit} />
