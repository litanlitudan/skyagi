<script lang="ts">
    import { Search } from 'flowbite-svelte';
    // import Scrolly from "./Scrolly.svelte";
    import Character from '$lib/room-new-character.svelte';
	import CharacterDashboard from '$lib/Character_dashboard.svelte';
    export const characters = [
        {name: "tan li", image: "../src/lib/assets/Avatar1.png", title:"", description:""},
        {name: "yy", image: "../src/lib/assets/Avatar2.png", title:"", description:""},
        {name: "Vegeta", image: "../src/lib/assets/Avatar3.png", title:"", description:""},
        {name: "Goku", image:"../src/lib/assets/Avatar3.png", title:"", description:""}];

    function getNthPicPositionStr(inputVal) {
        let startPointX = 120;
        let startPointY = 150;
        let widthX = 200;
        let widthY = 200;
        let leftVal = (inputVal%3) * widthX+startPointX
        let topVal = Math.floor(inputVal/3) * widthY+startPointY
        console.log("positin:absolute;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px") 
        return "position:absolute;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px"
    }

</script>
<input id="searchBar" type="search" placeholder="Search..." />
{#each characters as character, i}
    <div class="characterInfoSet" style={getNthPicPositionStr(i)}>
    <Character {character}>

    </Character>
    </div>
{/each}

<style>
    #searchBar {
        width: 200px
    }
    /* .characterInfoSet {

     } */

</style>