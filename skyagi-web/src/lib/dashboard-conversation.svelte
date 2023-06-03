<script lang="ts">
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    export let conversationIndex;
    export let conversationText;
</script>

<AccordionItem>
          

<span slot="header">Conversation {conversationIndex}</span>
    <p class="mb-2 text-gray-500 dark:text-gray-400">{conversationText}</p>
</AccordionItem>