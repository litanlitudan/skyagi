<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai';
	import { onMount } from 'svelte';
	import { StoreMessageRole } from './types';

	export let type: StoreMessageRole;
	export let name: string;
	export let message: string = '';
	export let userAgentName: string = '';
	export { classes as class };

	let classes = '';
	let scrollToDiv: HTMLDivElement;

	const classSet: { [key in StoreMessageRole]: string } = {
		[StoreMessageRole.USER_AGENT]: 'justify-end text-rose-700',
		[StoreMessageRole.AGENT]: 'justify-start text-teal-400',
		[StoreMessageRole.SYSTEM]: 'justify-center text-gray-400'
	};

	const typeEffect = (node: HTMLDivElement, message: string) => {
		return {
			update(message: string) {
				scrollToDiv.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'end' });
			}
		};
	};

	onMount(() => {
		scrollToDiv.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'end' });
	});

	const universalStyle="max-w-[80%] rounded-2xl p-0.25 mb-5 "
	const leftStyle="bg-gray-800 float-left !ring-blue-500 ring-2 rounded-bl-none"
	const rightStyle="bg-blue-700 float-left  rounded-br-none"
</script>

<div class="flex items-center {classSet[type]} ">
	<p class="text-sm px-2">{type === StoreMessageRole.USER_AGENT ? 'Me' : name}</p>
</div>

<div class="flex {classSet[type]}">
	<div
		use:typeEffect={message}
		class="{type == "user_agent" ? universalStyle+rightStyle : universalStyle+leftStyle} {classSet[type]} "
	>
		<div class="m-2">
			{@html DOMPurify.sanitize(marked.parse(message))}
		</div>
	</div>
	<div bind:this={scrollToDiv} />
</div>