<script lang="ts">
    // import Scrolly from "./Scrolly.svelte";
    import Character from '$lib/room-new-character.svelte';
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
        // console.log("positin:absolute;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px") 
        return "position:static;left:" + leftVal.toString() + "px;top:" + topVal.toString() + "px"
    }

    function get2DCharacterLs(inputLs, colNum) {
        let rstLs = []
        for (let i=0; i<Math.ceil(inputLs.length/colNum); i++){
            rstLs.push([]);
        }
        for (let i=0; i<inputLs.length;i++){
            rstLs[Math.floor(i/3)].push(inputLs[i]);
        }
        return rstLs
    }
    export const characters2D = get2DCharacterLs(characters, 3);

</script>
<input id="searchBar" type="search" placeholder="Search..." />


<!-- <div class="scroller">
    {#each characters2D as characterLs, i}
        <div class="characterRowSet">
        {#each characterLs as character, j}
            <div class="characterInfoSet" style={getNthPicPositionStr(i)}>
                <Character {character}>
                </Character>
            </div>
        {/each}
        </div>
    {/each}
</div> -->
<div class="scroller">
    {#each characters as character, i}
        <div class="characterInfoSet" style={getNthPicPositionStr(i)}>
            <Character {character}>
            </Character>
        </div>
    {/each}
</div>
<style>
    #searchBar {
        width: 200px
    }

    .characterRowSet {
        width: 100px;
    }

    .scroller {
        width: 700px;
        height: 500px;
        overflow-x: scroll;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(3, 180px);
        grid-template-rows: repeat(auto-fill, 200px);
}
</style>