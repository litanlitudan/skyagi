<script lang="ts">
	import { fly } from 'svelte/transition';

	export let role = '';
	export let message = '';
	const name = role == 'assistant' ? 'assistant' : 'you';
	const imgSrc = role == 'assistant' ? '/alfred-headshot.png' : '/batman-headshot.png';
</script>

<div
	in:fly={{ y: 50, opacity: 0, duration: 250, delay: name == 'you' ? 20 : 200 }}
	class="box {name}"
>
	<li class="flex py-4">
		<img class="h-10 w-10 rounded-full" src={imgSrc} alt="" />
		<div class="ml-3">
			<p>
				{message}
			</p>
		</div>
	</li>
</div>

<style>
	.box {
		font-family: helvetica;
		margin-bottom: 30px;
	}

	p {
		padding: 5px 20px;
	}

	.you {
		border-bottom-right-radius: 0px;
		float: right;
		clear: both;
		color: #fff;
	}

	.assistant {
		border-top-left-radius: 0px;
		float: left;
		clear: both;
	}
</style>
