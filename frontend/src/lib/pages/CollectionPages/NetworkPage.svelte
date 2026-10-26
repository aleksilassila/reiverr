<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import { usePageInfiniteQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	export let network: string;

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const items = usePageInfiniteQuery(tmdbQueries.network(networkId));
	const { loadMore } = items;
</script>

<CollectionPage
	items={$items.data ?? []}
	loading={$items.isLoading}
	title={networkName}
	subtitle="Network"
>
	<div class="-translate-y-80" slot="footer" use:loadMore />
</CollectionPage>
