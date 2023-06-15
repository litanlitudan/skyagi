<script lang="ts">
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    export let conversationIndex;
    export let conversationId;
    export let conversationSummary;
    export let open=false;
    export let activeId;
    if (conversationIndex == 1){
        open=true
    }
    function handleOpen(openStatus, crtId){
        if (openStatus==true){
            return conversationId
        }
        else {
            if (conversationId==crtId){
                return ""
            }
            else{
                return crtId
            }
        }
    }
    $: activeId = handleOpen(open, activeId)
    

</script>

<AccordionItem bind:open={open} id="accordion">
    <span slot="header">{conversationSummary.name}</span>
    <p class="whitespace-pre-line mb-2 text-gray-500 dark:text-gray-400 ">{conversationSummary.text}</p>
</AccordionItem>