<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer/VideoPlayer.svelte';
	import { setContext } from 'svelte';
	import type { LayoutData } from './$types';
	import { initialPlayerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import SetupRequired from '$lib/components/SetupRequired/SetupRequired.svelte';
	import { settings } from '$lib/stores/settings.store';

	setContext('player', initialPlayerState);

	settings.set({ autoplayTrailers: false });

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
	<SetupRequired missingEnvironmentVariables={data.missingEnvironmentVariables} />
{/if}
