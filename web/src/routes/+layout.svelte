<script>
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';


	inject({ mode: dev ? 'development' : 'production' });
</script>
