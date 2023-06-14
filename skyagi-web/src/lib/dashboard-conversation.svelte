<script lang="ts">
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    export let conversationIndex;
    export let conversationId;
    export let conversationSummary;
    export let open=false;
    export let activeId;
    console.log(conversationId)
    if (conversationIndex == 1){
        open=true
    }
    function handleOpen(openStatus){
        if (openStatus==true){
            return conversationId
        }
        else {
            return ""
        }
        
    }
    $: activeId = handleOpen(open)
    

</script>

<AccordionItem bind:open={open} id="accordion">
    <span slot="header">{conversationSummary.name}</span>
    <p class="whitespace-pre-line mb-2 text-gray-500 dark:text-gray-400 ">{conversationSummary.text}</p>
</AccordionItem>