<script lang="ts">
	import { getTmdbNetworkSeriesQuery, type DiscoverTvQuery } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import { fetchCardTmdbSeriesProps } from '$lib/components/Card/card';
	import type { ComponentProps } from 'svelte';
	import type { PageData } from './$types';
	import GridPage from '$lib/components/GridPage/GridPage.svelte';
	import { networks, type Network } from '$lib/discover';
	import InfiniteScroll from '$lib/components/GridPage/InfiniteScroll.svelte';

	export let data: PageData;

	const network = networks[data.network] || undefined;

	let currentPage: number = 1;
	let totalPages: number = 1;
	let isLoading: boolean = false;
	let hasMoreSeries: boolean = false;
	let networkSeriesProps: ComponentProps<Card>[] = [];

	$: hasMoreSeries = currentPage < totalPages;
	$: if (currentPage) {
		fetchData();
	}

	async function fetchData() {
		isLoading = true;
		try {
			const result = await fetchNetworkSeries(network, currentPage);
			totalPages = result.totalPages;
			networkSeriesProps = [...networkSeriesProps, ...result.networkSeriesProps];
		} catch (error) {
			console.error('Error fetching network series:', error);
			// Handle error appropriately, e.g., show an error message to the user
		} finally {
			isLoading = false;
		}
	}

	async function fetchNetworkSeries(
		network: Network,
		page: number
	): Promise<{ totalPages: number; networkSeriesProps: ComponentProps<Card>[] }> {
		const query: DiscoverTvQuery = {
			with_networks: network.tmdbNetworkId,
			page: page
		};

		const queryRes = await getTmdbNetworkSeriesQuery(query);
		const totalPages = queryRes?.total_pages ?? page;

		const shows = queryRes?.results || [];
		const networkSeriesProps = await Promise.all(shows.map(fetchCardTmdbSeriesProps));

		return {
			totalPages,
			networkSeriesProps
		};
	}

	function nextPageOnScrollEnd() {
		if (currentPage < totalPages) currentPage++;
	}
</script>

<GridPage title={data.network}>
	{#if network}
		{#each networkSeriesProps as showProps, index (index)}
			<Card {...showProps} size="dynamic" />
		{/each}
		{#if isLoading}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		{/if}
		<InfiniteScroll
			hasMore={hasMoreSeries}
			threshold={200}
			window={true}
			on:loadMore={nextPageOnScrollEnd}
		/>
	{:else}
		404
	{/if}
</GridPage>
