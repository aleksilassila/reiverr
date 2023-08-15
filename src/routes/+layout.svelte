<script lang="ts">
	import { page } from '$app/stores';
	import DynamicModal from '$lib/components/Modal/DynamicModal.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import UpdateChecker from '$lib/components/UpdateChecker.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<!-- {#if data.isApplicationSetUp} -->
<div class="app">
	<Navbar />
	<main>
		<slot />
	</main>
	{#key $page.url.pathname}
		<DynamicModal />
	{/key}
	<UpdateChecker />
</div>
<!-- {:else} -->
<!-- <SetupRequired missingEnvironmentVariables={data.missingEnvironmentVariables} /> -->
<!-- {/if} -->
