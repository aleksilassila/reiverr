<script lang="ts">
	import { getTmdbNetworkSeries, getTmdbNetworkSeriesRaw } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import { fetchCardTmdbSeriesProps } from '$lib/components/Card/card';
	import { onMount, type ComponentProps } from 'svelte';
	import type { PageData } from './$types';
	import GridPage from '$lib/components/GridPage/GridPage.svelte';
	import { networks, type Network } from '$lib/discover';
	import InfiniteScroll from '$lib/components/GridPage/InfiniteScroll.svelte';

	export let data: PageData;

	const network = networks[data.network] || undefined;

	let page: number = 1;
	let maxPage: number = 1;
	let loading: boolean = false;
	let networkSeriesProps: ComponentProps<Card>[] = [];

	$: hasMoreSeries = page < maxPage;

	async function fetchNetworkSeries(network: Network) {
		loading = true;

		const queryRes = await getTmdbNetworkSeriesRaw(network.tmdbNetworkId, page);
		maxPage = queryRes?.total_pages ?? page;

		const shows = queryRes?.results || [];
		const newNetworkSeriesProps = await Promise.all(shows.map(fetchCardTmdbSeriesProps));
		networkSeriesProps = [...networkSeriesProps, ...newNetworkSeriesProps];

		loading = false;
	}

	onMount(() => {
		fetchNetworkSeries(network);
	});
</script>

<GridPage title={data.network}>
	{#if network}
		{#each networkSeriesProps as showProps}
			<Card {...showProps} size="dynamic" />
		{/each}
		{#if loading}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		{/if}
		<InfiniteScroll
			hasMore={hasMoreSeries}
			threshold={100}
			window={true}
			on:loadMore={() => {
				page++;
				fetchNetworkSeries(network);
			}}
		/>
	{:else}
		404
	{/if}
</GridPage>
