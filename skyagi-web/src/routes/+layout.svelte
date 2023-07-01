<script lang="ts">
	import '../styles.css';
	import '../app.postcss';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { webVitals } from '$lib/vitals';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { Button } from 'flowbite-svelte';

	// Vercel Analytics
	let analyticsId = import.meta.env.VERCEL_ANALYTICS_ID;
	$: if (browser && analyticsId) {
		webVitals({
			path: $page.url.pathname,
			params: $page.params,
			analyticsId
		});
	}

	// Auth
	export let data: LayoutData;

	$: ({ supabase, session } = data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	function handleHomeButton() {
		window.location.href = '/dashboard';
	}

	function handleSettingsButton() {
		window.location.href = '/settings/account';
	}
</script>

<svelte:head>
	<title>SkyAGI</title>
</svelte:head>

<div id="header">
	<Button size="xl" on:click={handleSettingsButton}>Settings</Button>
	<Button size="xl" on:click={handleHomeButton}>Home</Button>
</div>
<div class="container" style="padding: 50px 0 100px 0">
	<slot />
</div>

<style>
	#header {
		text-align: right;
		margin-top: 20px;
		margin-right: 400px;
	}
</style>
