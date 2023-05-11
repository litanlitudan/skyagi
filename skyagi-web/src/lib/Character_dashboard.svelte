<script lang="ts">
	import type { CharacterType } from './types';
	import Character from './Character.svelte';
	import { Card } from 'flowbite-svelte';

	// Define the list of characters
	export let characters: CharacterType[];
</script>

{#each characters as character}
	<Character {character} />
{/each}

<style>
</style>
