<script lang="ts">
	import { networks } from '$lib/components/Collection/collections';
	import { loadMore, usePageInfiniteQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { capitalize } from '$lib/utils';
	import CollectionPage from './CollectionPage.svelte';

	interface Props {
		network: string;
	}

	let { network }: Props = $props();

	const networkId = networks[network]?.id;
	const networkName = networks[network]?.name ?? capitalize(network);

	const items = usePageInfiniteQuery(() => tmdbQueries.network(networkId));
</script>

<CollectionPage
	items={items.data ?? []}
	loading={items.isLoading}
	title={networkName}
	subtitle="Network"
>
	{#snippet footer()}
		<div class="-translate-y-80" {@attach loadMore(items)}></div>
	{/snippet}
</CollectionPage>
