<script lang="ts">
	import type { CharacterType } from './types';
    import { createEventDispatcher } from 'svelte';
    import { error } from '@sveltejs/kit';
    import { Img } from 'flowbite-svelte';
    import {notifications} from '$lib/notifications.js'
	import Toast from '$lib/Toast.svelte'
    import { browser } from '$app/environment';

	export let character;
    export let value;
    export let characters;
    export let avatarStyle = "rounded-lg border-none border-4 hover:border-solid border-indigo-600";



    // export let lastClickedCharacter;
    const dispatch = createEventDispatcher();
    function updateLastClickedCharacter(){
        dispatch("message", {
            character: character
        })
    };

    export let bindGroup = [];

    function onChange({ target }, elementId) {
        const { value, checked } = target;
            if (checked) {
                bindGroup = [...bindGroup, value]
                if (bindGroup.length > 4) {
                    notifications.warning("Please select no more than 4 characters", 2000)
                    console.log("Should pop up warnings")
                    if (browser) {
                        let characterCheck = document.getElementById(elementId);
                        characterCheck.checked=false;
                        bindGroup = bindGroup.filter((item) => item !== value)
                    }
        }
            } else {
                bindGroup = bindGroup.filter((item) => item !== value)
            }
        if (browser){
            let characterCheck = document.getElementById(elementId);
            character.selected=characterCheck.checked
            characters = characters;
        }
        console.log(character.selected)
    }

</script>

<div class="container">
    <div class=characterCheck>
        <input type=checkbox 
               id={character.name+"Checkbox"}
               value={value}
               checked={bindGroup.includes(value)}
               on:change={(e) => onChange(e, character.name+"Checkbox")}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
    </div>
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
    .characterCheck {
        margin: 0px;
        transform: translateX(-5px);
    }
</style>