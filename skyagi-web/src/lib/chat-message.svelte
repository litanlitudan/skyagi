<script lang="ts">
	import { fly } from 'svelte/transition';

	export let role = '';
	export let message = '';
	const name = role === 'assistant' ? 'assistant' : 'you';
</script>

<div
	in:fly={{ y: 50, opacity: 0, duration: 250, delay: name === 'you' ? 20 : 200 }}
	class="box {name}"
>
	<p class="text-sm font-medium">{name}</p>
	<p>
		{message}
	</p>
</div>

<style>
	.box {
		background-color: #eee;
		border-radius: 5px;
		font-family: helvetica;
		background-color: #eee;
		border-radius: 5px;
		margin-bottom: 30px;
		font-family: helvetica;
	}

	p {
		padding: 5px 20px;
	}

	.you {
		border-bottom-right-radius: 0px;
		float: right;
		clear: both;
		background: #3865f4;
		color: #fff;
	}

	.assistant {
		border-top-left-radius: 0px;
		float: left;
		clear: both;
		background-color: darkgray;
	}
</style>
