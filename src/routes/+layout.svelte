<script>
	import '../app.css';
	import { setClient } from 'svelte-apollo';
	import client from '$lib/apollo-client';
	import Navbar from './Navbar.svelte';

	setClient(client);
</script>

<div class="app">
	<Navbar />
	<main>
		<slot />
	</main>

	<!--	<footer>-->
	<!--		<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>-->
	<!--	</footer>-->
</div>
