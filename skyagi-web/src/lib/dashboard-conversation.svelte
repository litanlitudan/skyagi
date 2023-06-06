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
    <p class="mb-2 text-gray-500 dark:text-gray-400">{conversationSummary}</p>
</AccordionItem>