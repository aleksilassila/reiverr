<script lang="ts">
	import type { MediaSourceDto, OrderOptionDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import { getStackRouterPage } from '$lib/components/StackRouter/StackRouter';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { usePaginatedRequest } from '$lib/stores/data.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import { MixerHorizontal } from 'radix-icons-svelte';
	import { writable } from 'svelte/store';
	import CatalogueOptions from './CatalogueOptions.svelte';
	import TabItem from './TabItem.svelte';

	export let source: MediaSourceDto;

	const { topVisible } = getScrollContext();
	const { registrar } = getStackRouterPage();

	// const viewSettings = createLocalStorageStore<{
	// 	order: string | undefined;
	// 	direction: string | undefined;
	// }>('catalogue-view-settings-' + source.id, {
	// 	order: source.capabilities.sortOptions[0]?.value,
	// 	direction: source.capabilities.sortOptions[0]?.directions[0]?.value
	// });

	$: filterOptions = getFilters(source);
	$: filter = filterOptions[0];

	const viewSettings = writable<{
		order: string | undefined;
		direction: string | undefined;
	}>({
		order: undefined,
		direction: undefined
	});
	$: {
		$viewSettings = {
			order: filter?.orderOptions[0]?.value,
			direction: filter?.orderOptions[0]?.directions[0]?.value
		};
	}

	const { interactionObserver, data, load, isLoading } = usePaginatedRequest(
		async (page) => {
			if (!filter) {
				return {
					items: [],
					total: 0,
					itemsPerPage: 0,
					page: 0
				};
			}

			return reiverrApi.library
				.getCatalogue(source.userId, source.id, {
					type: filter.type,
					order: $viewSettings.order,
					direction: $viewSettings.direction,
					page
				})
				.then((r) => r.data);
		},
		{ loadOnInit: false }
	);

	$: {
		filter;
		$viewSettings;
		load({ lazy: true });
	}

	// $: items = selectedFilter
	// 	? reiverrApi.library
	// 			.getCatalogue(source.userId, source.id, {
	// 				type:
	// 					{
	// 						All: 'all' as const,
	// 						Movies: 'movies' as const,
	// 						Series: 'series' as const,
	// 						Missing: 'missing' as const
	// 					}[selectedFilter] ?? 'all',
	// 				order: $viewSettings.order,
	// 				direction: $viewSettings.direction
	// 			})
	// 			.then((r) => r.data.items)
	// 	: Promise.resolve([]);

	function getFilters(source: MediaSourceDto) {
		const filters: {
			label: string;
			type: 'all' | 'movies' | 'series' | 'missing';
			orderOptions: OrderOptionDto[];
		}[] = [];

		if (source.catalogueCapabilities.combinedCatalogue.isSupported) {
			filters.push({
				label: 'All',
				type: 'all',
				orderOptions: source.catalogueCapabilities.combinedCatalogue.orderOptions
			});
		}
		if (source.catalogueCapabilities.seriesCatalogue.isSupported) {
			filters.push({
				label: 'Series',
				type: 'series',
				orderOptions: source.catalogueCapabilities.seriesCatalogue.orderOptions
			});
		}
		if (source.catalogueCapabilities.moviesCatalogue.isSupported) {
			filters.push({
				label: 'Movies',
				type: 'movies',
				orderOptions: source.catalogueCapabilities.moviesCatalogue.orderOptions
			});
		}
		if (source.catalogueCapabilities.missingCatalogue.isSupported) {
			filters.push({
				label: 'Missing',
				type: 'missing',
				orderOptions: source.catalogueCapabilities.missingCatalogue.orderOptions
			});
		}

		return filters;
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Source Catalogue</h2>
	<TitleText title={source.name} size="sm" />
</FloatingHeader>

<Container class="min-h-full mx-32 space-y-8 pb-16 flex flex-col">
	<Container direction="horizontal" class="flex space-x-4 items-center justify-between">
		<div class="flex space-x-4">
			{#each filterOptions ?? [] as f}
				<TabItem selected={filter === f} on:select={() => (filter = f)}>
					{f.label}
				</TabItem>
			{/each}
		</div>
		<Button
			icon={MixerHorizontal}
			on:clickOrSelect={() =>
				filter &&
				createModal(CatalogueOptions, {
					orderOptions: filter.orderOptions,
					viewSettings
				})}
		>
			Options
		</Button>
	</Container>
	<div class="flex-1 flex flex-col">
		{#if $data.length}
			<CardGrid on:mount={registrar} focusOnMount let:columns>
				{#each $data.map((i) => i.tmdbItem) as item, index (item.id)}
					<TmdbCard
						{index}
						{item}
						on:enter={scrollIntoView({ top: index < columns ? 500 : 192 })}
					/>
				{/each}
			</CardGrid>
			<div use:interactionObserver />
		{:else if $isLoading}
			<Container class="h-ghost m-auto px-32">Loading...</Container>
		{:else}
			<Container class="h-ghost m-auto px-32">No items found</Container>
		{/if}
	</div>

	<!-- {#await items then items}
		<CardGrid on:mount={registrar} focusOnMount>
			{#each items.map((i) => i.tmdbItem) as item (item.id)}
				<TmdbCard {item} />
			{/each}
		</CardGrid>
	{/await} -->
</Container>
