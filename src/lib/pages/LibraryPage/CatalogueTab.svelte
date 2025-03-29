<script lang="ts">
	import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import { getStackRouterControls } from '$lib/components/StackRouter/StackRouter';
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import { MixerHorizontal } from 'radix-icons-svelte';
	import CatalogueOptions from './CatalogueOptions.svelte';
	import TabItem from './TabItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';

	export let source: MediaSourceDto;

	const { registrar } = getStackRouterControls();
	const viewSettings = createLocalStorageStore<{
		order: string | undefined;
		direction: string | undefined;
	}>('catalogue-view-settings-' + source.id, {
		order: source.capabilities.sortOptions[0]?.value,
		direction: source.capabilities.sortOptions[0]?.directions[0]?.value
	});

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
					type:
						{
							All: 'all' as const,
							Movies: 'movies' as const,
							Series: 'series' as const,
							Missing: 'missing' as const
						}[selectedFilter] ?? 'all',
					order: $viewSettings.order,
					direction: $viewSettings.direction
				})
				.then((r) => r.data.items)
		: Promise.resolve([]);
</script>

<Container class="mx-32 space-y-8 pb-16">
	<Container direction="horizontal" class="flex space-x-4 items-center justify-between">
		<div class="flex space-x-4">
			{#each filters ?? [] as filter}
				<TabItem selected={selectedFilter === filter} on:select={() => (selectedFilter = filter)}>
					{filter}
				</TabItem>
			{/each}
		</div>
		<Button
			icon={MixerHorizontal}
			on:clickOrSelect={() =>
				createModal(CatalogueOptions, {
					source,
					viewSettings
				})}
		>
			Options
		</Button>
	</Container>
	{#await items then items}
		<CardGrid on:mount={registrar} focusOnMount>
			{#each items.map((i) => i.tmdbItem) as item (item.id)}
				<TmdbCard {item} />
			{/each}
		</CardGrid>
	{/await}
</Container>
