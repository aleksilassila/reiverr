<script lang="ts">
	import { page } from '$app/stores';
	import DynamicModal from '$lib/components/Modal/DynamicModal.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import UpdateChecker from '$lib/components/UpdateChecker.svelte';
	import { type SettingsValues, defaultSettings, settings } from '$lib/stores/settings.store';
	import { writable } from 'svelte/store';
	import '../app.css';
	import type { LayoutServerData } from './$types';

	export let data: LayoutServerData;
	settings.set(data.settings);
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
