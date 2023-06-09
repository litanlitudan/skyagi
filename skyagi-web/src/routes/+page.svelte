<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';
	import type { PageData } from './$types';
	import '../app.postcss';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: {
		// check if user has been set in session store then redirect
		if (data.session && browser) {
			goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>SkyAGI</title>
</svelte:head>

<div class="row flex-center flex">
	<div class="col-6 form-widget">
		<Auth
			supabaseClient={data.supabase}
			view="magic_link"
			redirectTo={`${data.url}/auth/callback`}
			showLinks={false}
			appearance={{ theme: ThemeSupa, style: { input: 'color: #fff' } }}
		/>
	</div>
</div>
