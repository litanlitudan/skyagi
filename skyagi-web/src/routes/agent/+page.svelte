<script lang="ts">
	import AgentForm from '$lib/AgentForm.svelte';
	import type { AgentDataType } from '$lib/types';

	let agentData: AgentDataType = {
		name: 'Sheldon',
		age: '27',
		personalities: 'fun',
		socialStatus: 'single',
		memories: ['His best friend is Leonard.', 'He knows penny.']
	};
</script>

<AgentForm {agentData} />
