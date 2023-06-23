<script lang="ts">
	import { AccordionItem, Accordion } from 'flowbite-svelte';
	export let conversationIndex;
	export let conversationId;
	export let conversationSummary;
	export let open = false;
	export let activeId;
	if (conversationIndex == 1) {
		open = true;
	}
	function handleOpen(openStatus, crtId) {
		if (openStatus == true) {
			return conversationId;
		} else {
			if (conversationId == crtId) {
				return '';
			} else {
				return crtId;
			}
		}
	}
	$: activeId = handleOpen(open, activeId);
</script>

<AccordionItem bind:open id="accordion">
	<span slot="header">
		{conversationSummary.name}
	</span>
	<div slot="arrowup">
		<svg
			class="w-6 h-6 shrink-0 rotate-180"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
			/></svg
		>
	</div>
	<span slot="arrowdown">
		<svg
			class="w-6 h-6 shrink-0"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
			/></svg
		>
	</span>
	<p class="whitespace-pre-line mb-2 text-gray-400 text-xl">{conversationSummary.text}</p>
</AccordionItem>
