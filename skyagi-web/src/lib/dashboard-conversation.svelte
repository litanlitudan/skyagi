<script lang="ts">
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    export let conversationIndex;
    export let conversationSummary;
    let open = false;
    if (conversationIndex == 1) {
        open = true;
    }
</script>

<AccordionItem open={open}>
    <span slot="header">{conversationSummary.name}</span>
    <p class="whitespace-pre-line mb-2 text-gray-500 dark:text-gray-400 ">{conversationSummary.text}</p>
</AccordionItem>