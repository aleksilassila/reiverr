<script lang="ts">
	import { getTmdbNetworkSeries } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import CardGrid from '$lib/components/Card/CardGrid.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import { fetchCardTmdbSeriesProps } from '$lib/components/Card/card';
	import type { ComponentProps } from 'svelte';
	import type { PageData } from './$types';
	import GridPage from '$lib/components/GridPage/GridPage.svelte';
	import { networks, type Network } from '../../../../lib/discover';

	export let data: PageData;

	const network = networks[data.network] || undefined;

	async function fetchNetworkSeries(network: Network) {
		const shows = await getTmdbNetworkSeries(network.tmdbNetworkId);

		const showProps: ComponentProps<Card>[] = await Promise.all(
			shows.map(fetchCardTmdbSeriesProps)
		);

		return {
			shows,
			showProps
		};
	}
</script>

<GridPage title={data.network}>
	{#if network}
		{#await fetchNetworkSeries(network)}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		{:then { showProps }}
			{#each showProps as showProps}
				<Card {...showProps} size="dynamic" />
			{/each}
		{:catch error}
			{error.message}
		{/await}
	{:else}
		404
	{/if}
</GridPage>
