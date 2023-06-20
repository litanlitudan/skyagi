<script lang="ts">
	import type { CharacterType } from './types';
    import { createEventDispatcher } from 'svelte';
    import { error } from '@sveltejs/kit';
    import { Img } from 'flowbite-svelte';
    import {notifications} from '$lib/notifications.js'
	import Toast from '$lib/Toast.svelte'
    import { browser } from '$app/environment';

	export let character;
    export let characters;
    export let avatarStyle = "rounded-lg border-none border-4 hover:border-solid border-indigo-600";


    // export let lastClickedCharacter;
    const dispatch = createEventDispatcher();
    function updateLastClickedCharacter(){
        dispatch("message", {
            character: character
        })
    };



</script>

<div class="container">
    <figure>
        <img src={character.image} alt="" on:click={updateLastClickedCharacter}
        class={avatarStyle} width=100px />
        <figcaption> {character.name} </figcaption>
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