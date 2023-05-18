<script>
	import { Select, Label, Input, Button, A } from 'flowbite-svelte';
	import InputBlock from '../../../lib/input-block.svelte';

	let selected;
	let countries = [
		{ value: 'openai-gpt-3.5-turbo', name: 'openai-gpt-3.5-turbo' },
		{ value: 'openai-gpt-4', name: 'openai-gpt-4' },
		{ value: 'chatglm-6b-modelz', name: 'chatglm-6b-modelz' },
		{ value: 'moss-16b-modelz', name: 'moss-16b-modelz' },
		{ value: 'vicuna-13b-modelz', name: 'vicuna-13b-modelz' },
		{ value: 'mpt-7b-modelz', name: 'mpt-7b-modelz' }
	];
	let answer = '';

	let characterList = [
		{
			json: ''
		}
	];

	function setCharacterFields(value) {
		characterList = [...value]; // trigger a reactivity update
	}

	function handleSubmit() {
		alert(`answered question ${selected.id} (${selected.text}) with "${answer}"`);
	}

	const handleChange = (event, index) => {
		const values = [...characterList];
		console.log('handleChange', values);
		values[index][event.target.name] = event.target.value;

		setCharacterFields(values);
	};

	// adds new input
	const handleAdd = () => {
		console.log('add button clicked!');
		setCharacterFields([
			...characterList,
			{
				json: ''
			}
		]);
	};

	// removes input
	const handleRemove = index => {
		if (characterList.length !== 1) {
			const values = [...characterList];
			values.splice(index, 1);
			setCharacterFields(values);
		}
	};
</script>

<h1 class="text-4xl mb-20">Start a new chat session</h1>

<form on:submit|preventDefault={handleSubmit}>
	<Label class="mb-10 w-1/2">
		Select model
		<Select class="mt-5" items={countries} bind:value={selected} />
	</Label>

	{#if selected == 'vicuna-13b-modelz'}
		<Label class="mb-10 w-1/2">
			Inference endpoint URL
			<Input class="mt-5" placeholder="Enter the inference endpoint url" type="text" />
		</Label>
	{:else}
		<Label class="mb-10 w-1/2">
			Model token
			<Input class="mt-5" placeholder="Enter the token key" type="text" />
		</Label>
	{/if}

	<Label class="mb-10 w-1/2">
		Chat name
		<Input class="mt-5" placeholder="Enter the name of your new chat session" type="text" />
	</Label>

	<Label class="mb-10 w-2/3"
		>Add characters
		{#each characterList as item, index}
			<div>
				<InputBlock {handleAdd} {handleRemove} {index} {item} {handleChange} />
				<div class="mb-10" />
			</div>
		{/each}
	</Label>

	<Button outline gradient color="greenToBlue" type="submit">
		<A href={`/home/sessions/bigbangtheory`} aClass="hover:none" color="white"
			>Generate chat now !</A
		>
	</Button>
</form>

<style>
	input {
		display: block;
		width: 500px;
		max-width: 100%;
	}
</style>
