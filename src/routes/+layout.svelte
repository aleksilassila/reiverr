<script lang="ts">
	import DynamicModal from '$lib/components/Modal/DynamicModal.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import SetupRequired from '$lib/components/SetupRequired/SetupRequired.svelte';
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
		<!-- {#key $page.url.pathname} -->
		<DynamicModal />
		<!-- {/key} -->

		<!--	<footer>-->
		<!--		<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>-->
		<!--	</footer>-->
	</div>
{:else}
	<SetupRequired missingEnvironmentVariables={data.missingEnvironmentVariables} />
{/if}
