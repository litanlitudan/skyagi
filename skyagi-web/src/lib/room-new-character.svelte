<script lang="ts">
	import type { CharacterType } from './types';
	export let character: CharacterType;
    let yes=false;
</script>

<div class="container">
    <div class=characterCheck>
        <input type=checkbox checked={yes} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
    </div>
    <figure>
        <img src={character.image} alt="" width=100px />
        <figcaption> {character.name} </figcaption>
    </figure>
</div>
<style>
    figure {
        text-align: center;
        width: 100px;
        /* transform: translateX(50px); */
    }
    .container {
        grid-template-columns: 20px 100px;
        column-gap: 0px;
        display: grid;
        align-items: center;
    }
    .characterCheck {
        /* width:20px; */
        margin: 0px;
        transform: translateX(-5px);
    }
</style>