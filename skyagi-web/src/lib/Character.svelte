<script lang="ts">
	import type { AgentDataType } from './types';
	import { Card, Avatar, P } from 'flowbite-svelte';
	// import Icon1 from '$lib/assets/Avatar1.png';
	import { stringify } from 'postcss';
	export let character: AgentDataType;
	export let isPlayer: boolean;
	export let lastClickedAgentId: string;
	export let isStart: boolean;
	export let isEnd: boolean;

	let cardStyle="!border-blue-400 !border-1 hover:!bg-blue-600 hover:cursor-pointer rounded-none"
	if (isPlayer) {
		cardStyle="!bg-gray-700 !border-gray-400 !border-1 cursor-default"
	}
	if (isStart && isEnd) {
		cardStyle += "rounded-xl"
	}
	else if (isEnd) {
		cardStyle += "rounded-b-xl rounded-t-none"
	}
	else if (isStart) {
		cardStyle += "rounded-t-xl rounded-b-none"
	}
	// console.log($lastClickedAgentId)

	$: cardColor=(lastClickedAgentId==character.id) ? "background-color: rgb(37 99 235)" : "background-color: rgb(23 37 84)";
</script>

<Card bind:class={cardStyle} size="sm" style={cardColor}>
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
