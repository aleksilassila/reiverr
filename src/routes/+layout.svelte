<script lang="ts">
	import '../app.css';
	import Navbar from './components/Navbar/Navbar.svelte';
	import VideoPlayer from './components/VideoPlayer/VideoPlayer.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	let playerState = writable({ visible: false, jellyfinId: '' });

	setContext('player', {
		playerState,
		close: () => {
			playerState.set({ visible: false, jellyfinId: '' });
		},
		streamJellyfinId: (id: string) => {
			playerState.set({ visible: true, jellyfinId: id });
		}
	});
</script>

<div class="app">
	<Navbar />
	<main>
		<slot />
	</main>
	<VideoPlayer />

	<!--	<footer>-->
	<!--		<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>-->
	<!--	</footer>-->
</div>
