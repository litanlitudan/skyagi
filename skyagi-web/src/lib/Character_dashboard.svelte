<script lang="ts">
	import type { CharacterType } from './types';
	import Character from './Character.svelte';
	import { Card } from 'flowbite-svelte';

	// Define the list of characters
	export let characters: CharacterType[];
</script>

<div>
	{#each characters as character}
		<Character {character} />
	{/each}
</div>

<style>
</style>
