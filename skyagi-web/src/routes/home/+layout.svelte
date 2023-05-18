<script lang="ts">
	import '../../app.postcss';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		DarkMode,
		Sidebar,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Drawer,
		CloseButton,
		SidebarDropdownWrapper,
		SidebarCta
	} from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';
	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
	};
	let breakPoint: number = 1024;
	let width: number;
	let backdrop: boolean = false;
	let activateClickOutside = true;
	let drawerHidden: boolean = false;
	$: if (width >= breakPoint) {
		drawerHidden = false;
		activateClickOutside = false;
	} else {
		drawerHidden = true;
		activateClickOutside = true;
	}
	onMount(() => {
		if (width >= breakPoint) {
			drawerHidden = false;
			activateClickOutside = false;
		} else {
			drawerHidden = true;
			activateClickOutside = true;
		}
	});
	const toggleSide = () => {
		if (width < breakPoint) {
			drawerHidden = !drawerHidden;
		}
	};
	const toggleDrawer = () => {
		drawerHidden = false;
	};
	$: activeUrl = $page.url.pathname;
	let spanClass = 'pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white';
	let darkmodebtn =
		'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-lg p-2.5 fixed right-2 top-12  md:top-3 md:right-2 z-50';
</script>

<svelte:window bind:innerWidth={width} />

<DarkMode btnClass={darkmodebtn} />
<Drawer
	transitionType="fly"
	{backdrop}
	{transitionParams}
	bind:hidden={drawerHidden}
	bind:activateClickOutside
	width="w-64"
	class="overflow-scroll pb-32"
	id="sidebar"
>
	<div class="flex items-center">
		<CloseButton on:click={() => (drawerHidden = true)} class="mb-4 dark:text-white lg:hidden" />
	</div>
	<Sidebar asideClass="w-54">
		<SidebarWrapper divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
			<SidebarGroup>
				<SidebarItem
					label="Home"
					href="/home"
					on:click={toggleSide}
					active={activeUrl === `/home`}
				/>
				<SidebarItem
					label="About"
					href="/home/about"
					{spanClass}
					on:click={toggleSide}
					active={activeUrl === `/home/about`}
				/>
				<SidebarDropdownWrapper label="Chat sessions">
					<SidebarItem
						label="Big Bang Theory"
						href={`/home/sessions/bigbangtheory`}
						{spanClass}
						on:click={toggleSide}
						active={activeUrl === `/home/sessions/bigbangtheory`}
					/>
					<SidebarItem
						label="Avengers"
						href={`/home/sessions/avengers`}
						{spanClass}
						on:click={toggleSide}
						active={activeUrl === `/home/sessions/avengers`}
					/>
				</SidebarDropdownWrapper>
				<SidebarItem
					label="+ New chat"
					href={`/home/new`}
					{spanClass}
					on:click={toggleSide}
					active={activeUrl === `/home/new`}
				/>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>
</Drawer>

<div class="flex px-4 mx-auto w-full">
	<main class="lg:ml-72 w-full mx-auto">
		<slot />
	</main>
</div>
