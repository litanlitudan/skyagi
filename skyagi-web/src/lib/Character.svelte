<script lang="ts">
	import type { AgentDataType } from './types';
	import { Card, Avatar } from 'flowbite-svelte';
	// import Icon1 from '$lib/assets/Avatar1.png';
	import { stringify } from 'postcss';
	export let character: AgentDataType;
	export let isPlayer: boolean;
	export let lastClickedAgentId: string;

	let cardStyle="!bg-blue-700 !border-slate-950 hover:!bg-blue-800 hover:cursor-pointer"
	if (isPlayer) {
		cardStyle="!bg-gray-700 !border-slate-950 cursor-default"
	}
	// console.log($lastClickedAgentId)
	if (lastClickedAgentId==character.id) {
			cardStyle="!bg-blue-600 !border-slate-950 hover:!bg-blue-800 hover:cursor-pointer"
		}
</script>

<Card bind:class={cardStyle} size="sm">
	<div class="flex items-center space-x-4 !m-0">
		<Avatar src={character.avatarPath} size="md" alt={character.avatarPath} class="flex-shrink-0 m-0" />
		<!-- <div>{lastClickedAgentId}</div> -->
		<div class="flex-1 min-w-0">
			<p class="text-md font-light text-white-900 truncate dark:text-white">
				{character.name}
			</p>
			<p class="text-md font-light text-zinc-500 truncate dark:text-gray-400">
				{character.socialStatus}
			</p>
		</div>
	</div>
</Card>

<style>
</style>
