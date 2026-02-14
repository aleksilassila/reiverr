<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import { usePaginatedData } from '$lib/stores/data/data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let network: string;

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const { observer, ...items } = usePaginatedData((page) =>
		tmdbApi.v3
			.discoverTv({
				with_networks: networkId,
				page
			})
			.then((r) => r.data.results ?? [])
	);
</script>

<CollectionPage items={$items} title={networkName} subtitle="Network">
	<div class="-translate-y-80" slot="footer" use:observer />
</CollectionPage>
