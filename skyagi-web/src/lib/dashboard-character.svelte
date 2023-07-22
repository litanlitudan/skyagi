<script lang="ts">
	import { Img } from 'flowbite-svelte';
	import type { CharacterType } from './types';
	export let character: CharacterType;
	export let imageUrl;
</script>

<figure>
	<img class="rounded-lg" src={imageUrl} style="width:70px" alt=""/>
	<figcaption class="font-light text-sm">{character.name}</figcaption>
</figure>

<style>
	figure {
		text-align: center;
		width: 100px;
	}
	img {
		margin-left: 15px
	}
</style>
