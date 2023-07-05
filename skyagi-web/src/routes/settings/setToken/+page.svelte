<script>
    import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, 
            SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { Label, Input, Button } from 'flowbite-svelte'
    let spanClass = 'flex-1 ml-3 whitespace-nowrap';
    export let data;
    const models = data.models;
    import preSavedModelTokenDataStore from '$lib/token-store.js';
    let preSavedModelTokenDataIsEmpty = $preSavedModelTokenDataStore.length == 0;
    export let modelTokenData = models.map((item)=>({
        model: item.name,
        token: ""
    }))
    let preSavedModelTokenData = $preSavedModelTokenDataStore
    if ((preSavedModelTokenDataIsEmpty || (preSavedModelTokenDataStore == null)) !== true) {
        console.log(preSavedModelTokenData)
        modelTokenData = JSON.parse(preSavedModelTokenData)
    }
    
    console.log("predefined")
    console.log(preSavedModelTokenData[0])
    console.log("predefined end")
    function handleSubmit() {
        console.log(modelTokenData)
        preSavedModelTokenDataStore.set(JSON.stringify(modelTokenData))
    }
    function handleClear() {
        preSavedModelTokenDataStore.set([])
        window.location.href = '/settings/setToken'
    }

</script>

<div id="globalGrid">
    <Sidebar>
        <SidebarWrapper class="bg-gray-800">
        <SidebarGroup>
            <SidebarItem label="Account Settings" href='/settings/account' class='hover:bg-gray-400'>
            </SidebarItem>
            
            <SidebarItem label="Model Tokens" href='/settings/setToken' class='hover:bg-gray-400 bg-gray-600'>
            </SidebarItem>
        </SidebarGroup>
        </SidebarWrapper>
    </Sidebar>
    <div>
        {#each modelTokenData as modelTokenDataPoint, i}
            <Label for={modelTokenDataPoint.model} class='text-8xl text-white text-opacity-100'>{modelTokenDataPoint.model}</Label>
            <Input id={modelTokenDataPoint.model} size="lg" placeholder="Your token" bind:value={modelTokenDataPoint.token}/>
        {/each}
        <Button on:click={handleSubmit}>
            Submit
        </Button>
        <Button on:click={handleClear}>
            Clear
        </Button>
    </div>
    
</div>

<style>
    	#globalGrid {
		display: grid;
		grid-template-columns: repeat(2, 40%);
		grid-auto-flow: column;
		gap: 10px;
		/* grid-auto-columns: 400px 400px; */
	}
</style>