<script lang="ts">
	import ModalBackground from '$lib/components/Modal/ModalBackground.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import SetupRequired from '$lib/components/SetupRequired/SetupRequired.svelte';
	import TitlePageModal from '$lib/components/TitlePageLayout/TitlePageModal.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer/VideoPlayer.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.isApplicationSetUp}
	<div class="app">
		<Navbar />
		<main>
			<slot />
		</main>
		<VideoPlayer />
		<ModalBackground />
		<TitlePageModal />

		<!--	<footer>-->
		<!--		<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>-->
		<!--	</footer>-->
	</div>
{:else}
	<SetupRequired missingEnvironmentVariables={data.missingEnvironmentVariables} />
{/if}
