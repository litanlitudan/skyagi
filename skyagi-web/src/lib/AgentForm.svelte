<script lang="ts">
	import type { AgentDataType } from './types';

	export let agentData: AgentDataType = {
		name: '',
		age: '',
		personalities: '',
		socialStatus: '',
		memories: ['']
	};

	function handleSubmit() {}

	function addMemory() {
		agentData.memories = [...agentData.memories, ''];
	}

	function updateMemory(
		index: number,
		event: Event & { currentTarget: EventTarget & HTMLInputElement }
	) {
		agentData.memories[index] = (event.target as HTMLInputElement).value;
		agentData.memories = [...agentData.memories];
	}
</script>

<main>
	<form on:submit|preventDefault={handleSubmit}>
		<label>
			Name:
			<input type="text" bind:value={agentData.name} />
		</label>

		<label>
			Age:
			<input type="number" bind:value={agentData.age} />
		</label>

		<label>
			Personalities:
			<input type="text" bind:value={agentData.personalities} />
		</label>

		<label>
			Social status:
			<input type="text" bind:value={agentData.socialStatus} />
		</label>

		<label>
			Memories:
			{#each agentData.memories as memory, index}
				<div>
					<input type="text" bind:value={memory} on:input={event => updateMemory(index, event)} />
				</div>
			{/each}
			<button type="button" on:click={addMemory}>+</button>
		</label>

		<button type="submit">Submit</button>
	</form>
</main>
