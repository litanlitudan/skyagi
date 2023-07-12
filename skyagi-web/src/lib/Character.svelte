<script lang="ts">
	import type { AgentDataType } from './types';
	import { Card, Avatar } from 'flowbite-svelte';
	import Icon1 from '$lib/assets/Avatar1.png';
	export let character: AgentDataType;
</script>

<Card color="bg-blue-950" class="bg-blue-950 border-slate-950 hover:bg-blue-800">
	<div class="flex items-center space-x-4">
		<Avatar src={Icon1} alt={Icon1} class="flex-shrink-0" />
		<div class="flex-1 min-w-0">
			<p class="text-sm font-medium text-white-900 truncate dark:text-white">
				{character.name}
			</p>
			<p class="text-sm text-zinc-500 truncate dark:text-gray-400">
				{character.socialStatus}
			</p>
		</div>
	</div>
</Card>

<style>
</style>
