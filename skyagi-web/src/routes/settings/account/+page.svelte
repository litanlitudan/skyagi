<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { Sidebar, SidebarBrand, SidebarCta, SidebarDropdownItem, SidebarDropdownWrapper, 
        SidebarGroup, SidebarItem, SidebarWrapper, Input, Label } from 'flowbite-svelte';
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
				<Label for="email">Email</Label>
				<Input id="email" type="text" value={session.user.email} disabled />
			</div>

			<div>
				<Label for="fullName">Full Name</Label>
				<Input id="fullName" name="fullName" type="text" value={form?.fullName ?? fullName} />
			</div>

			<div>
				<Label for="username">Username</Label>
				<Input id="username" name="username" type="text" value={form?.username ?? username} />
			</div>

			<div>
				<Label for="website">Website</Label>
				<Input id="website" name="website" type="url" value={form?.website ?? website} />
			</div>
			

			<div>
				<input
					type="submit"
					id="profileText"
					class="button block primary round-lg h-10 !border-0 !bg-blue-600 hover:!bg-blue-700"
					value={loading ? 'Loading...' : 'Update'}
					disabled={loading}
				/>
			</div>
		</form>

		<form method="post" action="?/signout" use:enhance={handleSignOut}>
			<div>
				<button id="profileText" class="button block" disabled={loading}>Sign Out</button>
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
	#profileText {
		text-transform: none;
		/* margin-left: 10px; */
	}
</style>