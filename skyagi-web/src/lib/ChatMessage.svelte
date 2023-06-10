<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai';
	import { onMount } from 'svelte';
	import { StoreMessageRole } from './types';

	export let type: StoreMessageRole;
	export let name: string;
	export let message: string = '';
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
</script>

<div class="flex items-center {classSet[type]} ">
	<p class="text-xs px-2">{type === StoreMessageRole.USER_AGENT ? 'Me' : name}</p>
</div>

<div class="flex {classSet[type]}">
	<div
		use:typeEffect={message}
		class="bg-black py-0.5 px-4 max-w-2xl rounded leading-loose {classes} {classSet[type]}"
	>
		{@html DOMPurify.sanitize(marked.parse(message))}
	</div>
	<div bind:this={scrollToDiv} />
</div>
