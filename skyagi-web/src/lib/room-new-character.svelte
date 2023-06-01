<script lang="ts">
	import type { CharacterType } from './types';
	export let character: CharacterType;
    let yes=false;
</script>

<div class="container">
    <input type=checkbox checked={yes}>
    <figure>
        <img src={character.image} alt="" width=100px />
        <figcaption> {character.name} </figcaption>
    </figure>
</div>
<style>
    figure {
        text-align: center;
    }
    .container {
        grid-template-columns: 20px 200px;
        column-gap: 0px;
        display: grid;
        align-items: center;
    }
</style>