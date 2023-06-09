<script lang="ts">
    import { Img } from 'flowbite-svelte';
	import type { CharacterType } from './types';
	export let character: CharacterType;
    export let imageUrl;

</script>


<figure>
    <img class="rounded-lg" src={imageUrl} alt="" width=70px/>
    <figcaption> {character.name} </figcaption>
</figure>


<style>
    figure {
        text-align: center;
        width: 70px;
    }
</style>