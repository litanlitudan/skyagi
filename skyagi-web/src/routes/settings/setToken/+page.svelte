<script>
    import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, 
            SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { Label, Input } from 'flowbite-svelte'
    let spanClass = 'flex-1 ml-3 whitespace-nowrap';
    export let data;
    const models = data.models;
    export let modelTokenData = models.map((item)=>({
        model: item.name,
        token: ""
    }))
    // $: activeUrl = $page.url.pathname
</script>
<div id="globalGrid">
    <Sidebar>
        <SidebarWrapper>
        <SidebarGroup>
            <SidebarItem label="Account Settings" href='/settings/account'>
            </SidebarItem>
            
            <SidebarItem label="Model Tokens" href='/settings/setToken' >
            </SidebarItem>
        </SidebarGroup>
        </SidebarWrapper>
    </Sidebar>
    <div>
        {#each modelTokenData as modelTokenDataPoint, i}
            <Label for={modelTokenDataPoint.model} class='text-8xl text-white text-opacity-100'>{modelTokenDataPoint.model}</Label>
            <Input id={modelTokenDataPoint.model} size="lg" placeholder="Your token" bind:value={modelTokenDataPoint.token}/>
        {/each}
    </div>
    <div>
        <input
            type="submit"
            class="button block primary"
            value={loading ? 'Loading...' : 'Update'}
            disabled={loading}
        />
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