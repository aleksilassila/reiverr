<script lang="ts">
	import { page } from '$app/stores';
	import I18n from '$lib/components/Lang/I18n.svelte';
	import DynamicModal from '$lib/components/Modal/DynamicModal.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import SetupRequired from '$lib/components/SetupRequired/SetupRequired.svelte';
	import UpdateChecker from '$lib/components/UpdateChecker.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.isApplicationSetUp}
	<I18n />
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
{:else}
	<SetupRequired missingEnvironmentVariables={data.missingEnvironmentVariables} />
{/if}
