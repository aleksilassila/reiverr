<script lang="ts">
	import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import { getStackRouterControls } from '$lib/components/StackRouter/StackRouter';
	import { reiverrApi } from '$lib/stores/user.store';
	import TabItem from './TabItem.svelte';

	export let source: MediaSourceDto;

	const { registrar } = getStackRouterControls();

	let filters: string[] = [];
	let selectedFilter = '';

	$: {
		filters = [
			...(source.capabilities.combinedCatalogue ? ['All'] : []),
			...(source.capabilities.seriesCatalogue ? ['Series'] : []),
			...(source.capabilities.moviesCatalogue ? ['Movies'] : []),
			...(source.capabilities.missingCatalogue ? ['Missing'] : [])
		];
		selectedFilter = filters[0] ?? '';
	}

	$: items = selectedFilter
		? reiverrApi.library
				.getCatalogue(source.userId, source.id, {
					filter:
						{
							All: 'all',
							Movies: 'movies',
							Series: 'series',
							Missing: 'missing'
						}[selectedFilter] ?? 'all'
				})
				.then((r) => r.data.items)
		: Promise.resolve([]);
</script>

<Container class="mx-32 space-y-8">
	<Container direction="horizontal" class="flex space-x-4">
		{#each filters ?? [] as filter}
			<TabItem selected={selectedFilter === filter} on:select={() => (selectedFilter = filter)}>
				{filter}
			</TabItem>
		{/each}
	</Container>
	{#await items then items}
		<CardGrid on:mount={registrar} focusOnMount>
			{#each items.map((i) => i.tmdbItem) as item (item.id)}
				<TmdbCard {item} />
			{/each}
		</CardGrid>
	{/await}
</Container>
