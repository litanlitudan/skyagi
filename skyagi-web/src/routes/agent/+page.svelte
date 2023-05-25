<script lang="ts">
	import AgentForm from '$lib/AgentForm.svelte';
	import '../../app.postcss';
	import type { AgentDataType } from '$lib/types';
	import { DarkMode } from 'flowbite-svelte';

	let agentData: AgentDataType = {
		name: 'Sheldon',
		age: '27',
		personalities: 'fun',
		socialStatus: 'single',
		memories: ['His best friend is Leonard.', 'He knows penny.']
	};
</script>

<DarkMode class="text-2xl" />
<AgentForm {agentData} />
