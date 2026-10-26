<script lang="ts">
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import QuickNav from '$lib/components/QuickNav.svelte';
	import { LETTERS, type Letter } from '$lib/utils';
	import TitleText from '$lib/components/TitleText.svelte';
	import {
		catalogQueries,
		mediaTypeOf,
		type CatalogCategory,
		type CatalogOrder,
		type CatalogOrderDirection
	} from '$lib/queries/catalog.queries';
	import { usePageInfiniteQuery } from '$lib/queries/page-query';
	import { scrollIntoView, scrollToTop } from '$lib/selectable';
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { ArrowDown, ArrowUp } from 'radix-icons-svelte';
	import { derived, writable } from 'svelte/store';
	import { titleBadges } from '../../components/Card/title-badges';
	import TmdbCard from '../../components/Card/TmdbCard.svelte';
	import CardGrid from '../../components/CardGrid.svelte';

	type Category = 'series' | 'movies';

	const CATEGORIES: { label: string; value: Category }[] = [
		{ label: 'Series', value: 'series' },
		{ label: 'Movies', value: 'movies' }
	];
	const SORTS: { label: string; value: CatalogOrder }[] = [
		{ label: 'Added', value: 'date-added' },
		{ label: 'Last Release', value: 'last-release-date' },
		{ label: 'First Release', value: 'first-release-date' },
		{ label: 'Name', value: 'name' }
	];
	// The direction a sort starts in: newest, A to Z
	const NATURAL: Record<CatalogOrder, CatalogOrderDirection> = {
		'date-added': 'desc',
		'last-release-date': 'desc',
		'first-release-date': 'desc',
		name: 'asc'
	};

	const { topVisible } = getScrollContext();

	let didMount = false;

	const category = writable<CatalogCategory>('all');
	const letter = writable<Letter | null>(null);
	const viewSettings = createLocalStorageStore<{
		order: CatalogOrder;
		direction: CatalogOrderDirection;
		separateRequested: boolean;
	}>('library-available-view-settings', {
		order: 'date-added',
		direction: 'desc',
		separateRequested: true
	});

	const filters = derived(
		[category, letter, viewSettings],
		([$category, $letter, $viewSettings]) => ({
			mediaType: mediaTypeOf($category),
			letter: $letter ?? undefined,
			order: $viewSettings.order,
			direction: $viewSettings.direction
		})
	);

	// Grouped, the first list is the requested titles and the second the rest; else the first is every title
	const requested = usePageInfiniteQuery(
		derived([filters, viewSettings], ([$filters, $viewSettings]) =>
			catalogQueries.library({
				...$filters,
				...($viewSettings.separateRequested ? { status: 'requested' as const } : {})
			})
		)
	);
	const unrequested = usePageInfiniteQuery(
		derived([filters, viewSettings], ([$filters, $viewSettings]) => ({
			...catalogQueries.library({ ...$filters, status: 'unrequested' }),
			enabled: $viewSettings.separateRequested
		}))
	);
	const { loadMore: loadMoreRequested } = requested;
	const { loadMore: loadMoreUnrequested } = unrequested;

	$: requestedItems = $requested.data ?? [];
	$: unrequestedItems = ($viewSettings.separateRequested && $unrequested.data) || [];
	$: error = $requested.error ?? $unrequested.error;

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	// Selecting the category that is shown shows both again
	function filter(selected: Category) {
		$category = $category === selected ? 'all' : selected;
	}

	// Selecting the letter that is on turns the filter off
	function filterLetter(index: number) {
		const selected = LETTERS[index] ?? null;
		$letter = $letter === selected ? null : selected;
	}

	// One sort is always on; selecting it again turns it around
	function selectSort(order: CatalogOrder) {
		viewSettings.update((settings) =>
			settings.order === order
				? { ...settings, direction: settings.direction === 'asc' ? 'desc' : 'asc' }
				: { ...settings, order, direction: NATURAL[order] }
		);
	}

	function toggleSeparateRequested() {
		viewSettings.update((settings) => ({
			...settings,
			separateRequested: !settings.separateRequested
		}));
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Library</h2>
	<TitleText title="Available" size="sm" />
</FloatingHeader>

<Container direction="horizontal" class="min-h-full flex" focusOnMount>
	<Container class="flex-1 min-w-0 pb-16 space-y-8 flex flex-col" let:hasFocus focusOnMount>
		<div class="h-full flex-1 flex flex-col">
			<Scrollable class="mx-32 flex items-end space-x-8" fadeWidth={3}>
				<div class="flex-shrink-0">
					<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
						Media Type
					</div>
					<Container direction="horizontal" class="flex space-x-4">
						{#each CATEGORIES as option (option.value)}
							<Pill
								selected={$category === option.value}
								on:clickOrSelect={() => filter(option.value)}
								on:enter={scrollIntoView({ horizontal: 64 })}
							>
								{option.label}
							</Pill>
						{/each}
					</Container>
				</div>
				<div class="flex-shrink-0">
					<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
						Display
					</div>
					<Container direction="horizontal" class="flex">
						<Pill
							selected={$viewSettings.separateRequested}
							on:clickOrSelect={toggleSeparateRequested}
							on:enter={scrollIntoView({ horizontal: 64 })}
						>
							Group Requested
						</Pill>
					</Container>
				</div>
				<div class="flex-shrink-0">
					<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
						Sort By
					</div>
					<Container direction="horizontal" class="flex space-x-4">
						{#each SORTS as option (option.value)}
							<Pill
								selected={$viewSettings.order === option.value}
								on:clickOrSelect={() => selectSort(option.value)}
								on:enter={scrollIntoView({ horizontal: 64 })}
							>
								<span class="flex items-center">
									{option.label}
									{#if $viewSettings.order === option.value}
										<svelte:component
											this={$viewSettings.direction === 'desc' ? ArrowDown : ArrowUp}
											size={20}
											class="ml-2"
										/>
									{/if}
								</span>
							</Pill>
						{/each}
					</Container>
				</div>
			</Scrollable>
			<Container
				focusOnMount={hasFocus || !didMount}
				on:mount={() => {
					didMount = true;
				}}
				focusedChild
				class="flex-1 flex flex-col"
			>
				{#if requestedItems.length}
					<div class="my-6">
						{#if $viewSettings.separateRequested}
							<div class="px-32 mb-6 h3">Requested</div>
						{/if}
						<CardGrid class="px-32" let:columns on:back={scrollToTop}>
							{#each requestedItems as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									item={item.tmdbItem}
									progress={item.lastPlayState?.progress || 0}
									badges={titleBadges(item, { requested: !$viewSettings.separateRequested })}
									on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
								/>
							{/each}
						</CardGrid>
						<div use:loadMoreRequested />
					</div>
				{/if}
				{#if unrequestedItems.length}
					<div class="mt-6 px-32">
						<div class="mb-6 h3">On disk</div>
						<CardGrid let:columns>
							{#each unrequestedItems as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									item={item.tmdbItem}
									progress={item.lastPlayState?.progress || 0}
									badges={titleBadges(item)}
									on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
								/>
							{/each}
						</CardGrid>
						<div use:loadMoreUnrequested />
					</div>
				{/if}

				{#if !requestedItems.length && !unrequestedItems.length}
					{#if $requested.isLoading || $unrequested.isLoading}
						<Container class="h-ghost m-auto px-32">Loading...</Container>
					{:else if error}
						<Container focusOnMount class="h-ghost m-auto px-32 text-red-400">
							{errorMessage(error)}
						</Container>
					{:else}
						<Container focusOnMount class="h-ghost m-auto px-32">
							{#if $letter}
								Nothing on disk under {$letter}.
							{:else if $category !== 'all'}
								No {$category} on disk.
							{:else}
								Nothing on disk yet.
							{/if}
						</Container>
					{/if}
				{/if}
			</Container>
		</div>
	</Container>
	<QuickNav
		size="sm"
		class="fixed right-12 inset-y-0 justify-center z-10"
		items={LETTERS}
		selected={$letter ? LETTERS.indexOf($letter) : -1}
		on:select={({ detail }) => filterLetter(detail)}
	/>
</Container>
