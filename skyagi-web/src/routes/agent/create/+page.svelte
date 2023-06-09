<script lang="ts">
	import AgentForm from '$lib/AgentForm.svelte';
	import type { User } from '@supabase/supabase-js';
	import type { PageData } from './$types';

	export let data: PageData;

	let user: User = data.user;
</script>

<AgentForm {user} />
