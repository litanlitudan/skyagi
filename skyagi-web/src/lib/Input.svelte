<script lang="ts">
	export let value: any;
	export let placeholder = '';
	export let name = '';
	export let type = 'text';
	export let label = '';
	let classes = '';
	export { classes as class };

	const typeAction = (node: HTMLInputElement) => {
		node.type = type;
	};
</script>

<div class="flex flex-col min-w-xl {classes}">
	<label class="text-xs" for={name}>{label}</label>
	<input
		{name}
		{placeholder}
		use:typeAction
		bind:value
		class="shadow bg-gray-900 rounded-md px-4 py-1.5 min-w-xl text-gray-300 border border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent"
		{...$$restProps}
	/>
</div>
