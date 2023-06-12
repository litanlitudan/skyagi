<script lang="ts">
    import { AccordionItem, Accordion } from 'flowbite-svelte';
    export let conversationIndex;
    export let conversationSummary;
    export let open=false;
    export let openLs;
    export let accordionIndex;
    import { browser } from '$app/environment';
    
    let testOpen;
    function testIfOpen(inputOpen){
        console.log(inputOpen)
        return inputOpen
    }
    $: testOpen = testIfOpen(open);
    // function updateOpenLs(inputLs) {
    //     for (let i=0; i<inputLs.length; i++){
    //         if 
    //         inputLs.push(false)
    //     }
    // }
</script>

<AccordionItem open={open} id="accordion">
    <span slot="header">{conversationSummary.name}</span>
    <p class="whitespace-pre-line mb-2 text-gray-500 dark:text-gray-400 ">{conversationSummary.text}</p>
</AccordionItem>