<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import '../../../../app.postcss';
	import type { CharacterType } from '$lib/types';
	import Chatbot from '$lib/chatbot-websocket.svelte';
	import CharacterDashboard from '$lib/Character_dashboard.svelte';
	import Character from '$lib/Character.svelte';
	import Icon1 from '$lib/assets/Avatar1.png';
	import Icon2 from '$lib/assets/Avatar2.png';
	import Icon3 from '$lib/assets/Avatar3.png';

	let character: CharacterType = {
		image: Icon1,
		name: 'Penny',
		title: 'Waitress',
		description: 'Description of character 1.'
	};
	let characters: CharacterType[] = [
		{
			image: Icon2,
			name: 'Sheldon',
			title: 'Theoretical Physicist',
			description: 'Description of character 2.'
		},
		{
			image: Icon3,
			name: 'Leonard',
			title: 'Experimental Physicist',
			description: 'Description of character 2.'
		}
	];
</script>

<div class="min-h-screen h-screen flex flex-col">
	<Heading class="p-8" tag="h1" customSize="text-3xl">Chat: Big Bang Theory</Heading>

	<div class="grid grid-cols-8 gap-32">
		<div class="col-span-2 h-150">
			<div class="flex flex-col gap-20">
				<div class="w-60 h-20">
					<h1 class="mb-2 text-2xl">Me</h1>
					<Character {character} />
				</div>
				<div class="w-60">
					<h1 class="mb-2 text-2xl">Agents</h1>
					<CharacterDashboard {characters} />
				</div>
			</div>
		</div>
		<div class="col-span-6 overflow-y-auto">
			<Chatbot />
		</div>
	</div>
</div>
