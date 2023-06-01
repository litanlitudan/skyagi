<script lang="ts">
	let message = '';

	async function hello() {
		const response = await fetch('/api/hello', {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		let data = await response.json();
		message = data['message'];
	}
</script>

<button on:click={hello}>Hello</button>
<p>{message}</p>
