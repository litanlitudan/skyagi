<script lang="ts">
	import '../app.postcss';

	export let index: number;
	export let item: {};
	export let handleChange: (event: any, index: number) => void;
	export let handleRemove: () => void;
	export let handleAdd: () => void;
</script>

<div>
	<textarea
		id="json"
		name="json"
		rows="4"
		class="mt-5 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		placeholder="Paste character json file here..."
		on:change={event => handleChange(event, index)}
	/>

	<div class="flex space-x-4">
		<button
			type="button"
			class="mt-5 text-grey-800 border border-grey-700 hover:bg-grey-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-grey-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:border-grey-500 dark:text-grey-500 dark:hover:text-white dark:focus:ring-grey-800 dark:hover:bg-grey-500"
			on:click={handleAdd}
		>
			<svg
				class="h-6 w-6 text-indigo-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
		</button>

		<button
			type="button"
			class="mt-5 text-grey-800 border border-grey-700 hover:bg-grey-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-grey-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:border-grey-500 dark:text-grey-500 dark:hover:text-white dark:focus:ring-grey-800 dark:hover:bg-grey-500"
			on:click={handleRemove}
		>
			<svg
				class="h-6 w-6 text-indigo-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
				/>
			</svg>
		</button>
	</div>
</div>
