<script lang="ts">
	import type { CharacterType } from './types';
	export let character: CharacterType;

</script>


<figure>
    <img src={character.image} alt="" width=80px/>
    <figcaption> {character.name} </figcaption>
</figure>


<style>
    figure {
        text-align: center;
        width: 100px;
        /* transform: translateX(50px); */
    }
</style>