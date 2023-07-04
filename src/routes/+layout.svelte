<script lang="ts">
	import '../app.css';
	import Navbar from './components/Navbar/Navbar.svelte';
	import VideoPlayer from './components/VideoPlayer/VideoPlayer.svelte';
	import { setContext } from 'svelte';
	import type { LayoutData } from './$types';
	import { initialPlayerState } from './components/VideoPlayer/VideoPlayer';

	setContext('player', initialPlayerState);

	export let data: LayoutData;
</script>

{#if data.isApplicationSetUp}
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
{:else}
	<div>Application not set up</div>
{/if}
