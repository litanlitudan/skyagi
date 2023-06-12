<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';

	export let errorCode: number;
	export let errorName: string;
	export let errorMsg: string;

	let popUpError = true;
</script>

<Modal title="Error" bind:open={popUpError} autoclose outsideclose>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Error Name: {errorName} (Status Code: {errorCode})
	</p>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		Error Message: {errorMsg}
	</p>
	<svelte:fragment slot="footer">
		<Button color="alternative" on:click={() => (popUpError = false)}>Close</Button>
	</svelte:fragment>
</Modal>
