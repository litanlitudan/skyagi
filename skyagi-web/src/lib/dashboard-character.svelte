<script lang="ts">
	import type { CharacterType } from './types';
	export let character: CharacterType;

</script>


<figure>
    <img src={character.image} alt="" width=70px/>
    <figcaption> {character.name} </figcaption>
</figure>


<style>
    figure {
        text-align: center;
        width: 70px;
    }
</style>