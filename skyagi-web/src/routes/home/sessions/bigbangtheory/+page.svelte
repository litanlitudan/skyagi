<script>
	import Chatbot from '../../../../lib/chatbot.svelte';
	import { Heading } from 'flowbite-svelte';
	import '../../../../app.postcss';
</script>

<div class="min-h-screen h-screen flex flex-col">
	<Heading class="p-8" tag="h1" customSize="text-3xl">Chat: Big Bang Thoery</Heading>

	<div class="grid grid-cols-8 gap-32">
		<div class="col-span-2 h-150">
			<div class="flex flex-col gap-20">
				<div class="h-20 border border-indigo-300 rounded-md">Me (add info about Penny here)</div>
				<div class="h-80 border border-indigo-300 rounded-md">
					Agents (add info about Sheldon and Lenord here)
				</div>
			</div>
		</div>
		<div class="col-span-6 overflow-y-auto">
			<Chatbot />
		</div>
	</div>
</div>
