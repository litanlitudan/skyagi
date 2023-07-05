<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, 
        SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let { session, profile } = data;

	let profileForm: any;
	let loading = false;
	let fullName: string = profile?.full_name ?? '';
	let username: string = profile?.username ?? '';
	let website: string = profile?.website ?? '';
	let avatarUrl: string = profile?.avatar_url ?? '';

	const handleSubmit: SubmitFunction = () => {
		loading = true;
		return async () => {
			loading = false;
		};
	};

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	};
</script>
<div id="globalGrid">
	<Sidebar>
        <SidebarWrapper class="bg-gray-800">
        <SidebarGroup>
            <SidebarItem label="Account Settings" href='/settings/account' class='hover:bg-gray-400 bg-gray-600'>
            </SidebarItem>
            
            <SidebarItem label="Model Tokens" href='/settings/setToken' class='hover:bg-gray-400'>
            </SidebarItem>
        </SidebarGroup>
        </SidebarWrapper>
    </Sidebar>
	<div class="form-widget">
		<form
			class="form-widget"
			method="post"
			action="?/update"
			use:enhance={handleSubmit}
			bind:this={profileForm}
		>
			<div>
				<label for="email">Email</label>
				<input id="email" type="text" value={session.user.email} disabled />
			</div>

			<div>
				<label for="fullName">Full Name</label>
				<input id="fullName" name="fullName" type="text" value={form?.fullName ?? fullName} />
			</div>

			<div>
				<label for="username">Username</label>
				<input id="username" name="username" type="text" value={form?.username ?? username} />
			</div>

			<div>
				<label for="website">Website</label>
				<input id="website" name="website" type="url" value={form?.website ?? website} />
			</div>
			

			<div>
				<input
					type="submit"
					class="button block primary"
					value={loading ? 'Loading...' : 'Update'}
					disabled={loading}
				/>
			</div>
		</form>

		<form method="post" action="?/signout" use:enhance={handleSignOut}>
			<div>
				<button class="button block" disabled={loading}>Sign Out</button>
			</div>
		</form>
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