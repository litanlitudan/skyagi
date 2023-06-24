<script>
    import modelTokenDataStore from '$lib/room-store.js';
	import { onMount } from 'svelte/internal';
    let tempTokenData = ""
    let modelTokenData = []
    onMount(() => {
        tempTokenData =  $modelTokenDataStore;
        modelTokenData = JSON.parse(tempTokenData)
    })    
</script>
<h1 class="text-4xl">Chat room and conversations</h1>
{#each modelTokenData as modelToken, i}
    <h1>{modelTokenData[i].data.name}</h1>
{/each}

