<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import type { StackRouterPageProps } from '$lib/components/StackRouter/StackRouterPage.type';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let network: string;
	export let registrar: StackRouterPageProps['registrar'];
	export let handleGoBack: StackRouterPageProps['handleGoBack'];

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const items = tmdbApi.v3
		.discoverTv({
			with_networks: networkId
		})
		.then((r) => r.data.results ?? []);
</script>

<CollectionPage {registrar} {handleGoBack} {items} title={networkName} subtitle="Network" />
