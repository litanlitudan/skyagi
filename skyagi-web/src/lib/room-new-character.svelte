<script lang="ts">
	import type { CharacterType } from './types';
	export let character: CharacterType;
    let yes=false;
</script>

<div class="container">
    <input type=checkbox checked={yes} class="characterCheck">
    <figure>
        <img src={character.image} alt="" width=100px />
        <figcaption> {character.name} </figcaption>
    </figure>
</div>
<style>
    figure {
        text-align: center;
        width: 100px;
        transform: translateX(-50px);
    }
    .container {
        grid-template-columns: 20px 100px;
        column-gap: 0px;
        display: grid;
        align-items: center;
    }
    .characterCheck {
        width:20px;
        margin: 0px;
        transform: translateX(-20px);
    }
</style>