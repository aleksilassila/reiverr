<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let network: string;

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const items = tmdbApi.v3
		.discoverTv({
			with_networks: networkId
		})
		.then((r) => r.data.results ?? []);
</script>

<CollectionPage {items} title={networkName} subtitle="Network" />
