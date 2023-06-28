<script lang="ts">
	import type { CharacterType } from './types';
	import { createEventDispatcher } from 'svelte';
	import Toast from '$lib/Toast.svelte';

	export let character;
	export let avatarStyle = 'rounded-lg border-none border-4 hover:border-solid border-indigo-600';

	// export let lastClickedCharacter;
	const dispatch = createEventDispatcher();
	function updateLastClickedCharacter() {
		dispatch('message', {
			character: character
		});
	}
</script>

<div class="container">
	<figure>
		<img
			src={character.image}
			alt=""
			on:click={updateLastClickedCharacter}
			class={avatarStyle}
			width="100px"
		/>
		<figcaption class="text-lg mt-2">{character.name}</figcaption>
	</figure>
</div>
<Toast />

<style>
	figure {
		text-align: center;
		width: 100px;
	}
	.container {
		grid-template-columns: 20px 100px;
		column-gap: 0px;
		display: grid;
		align-items: center;
	}
</style>
