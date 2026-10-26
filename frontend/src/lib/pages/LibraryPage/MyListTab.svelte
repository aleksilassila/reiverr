<script lang="ts">
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
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
		{ label: 'Last Release', value: 'last-release-date' },
		{ label: 'First Release', value: 'first-release-date' },
		{ label: 'Date Added', value: 'date-added' },
		{ label: 'Name', value: 'name' }
	];
	// The direction a sort starts in: newest, A to Z
	const NATURAL: Record<CatalogOrder, CatalogOrderDirection> = {
		'last-release-date': 'desc',
		'first-release-date': 'desc',
		'date-added': 'desc',
		name: 'asc'
	};

	const { topVisible } = getScrollContext();

	let didMount = false;

	const category = writable<CatalogCategory>('all');
	const letter = writable<Letter | null>(null);
	const libraryViewSettings = createLocalStorageStore<{
		order: CatalogOrder;
		direction: CatalogOrderDirection;
		separateWatched: boolean;
	}>('library-view-settings', {
		order: 'last-release-date',
		direction: 'desc',
		separateWatched: true
	});

	const filters = derived(
		[category, letter, libraryViewSettings],
		([$category, $letter, $libraryViewSettings]) => ({
			mediaType: mediaTypeOf($category),
			letter: $letter ?? undefined,
			order: $libraryViewSettings.order,
			direction: $libraryViewSettings.direction
		})
	);

	const upcoming = usePageInfiniteQuery(
		derived(letter, ($letter) =>
			catalogQueries.myList({
				mediaType: 'series',
				letter: $letter ?? undefined,
				order: 'last-played',
				status: 'continue-watching'
			})
		)
	);
	const unwatched = usePageInfiniteQuery(
		derived([filters, libraryViewSettings], ([$filters, $libraryViewSettings]) =>
			catalogQueries.myList({
				...$filters,
				...($libraryViewSettings.separateWatched ? { status: 'unwatched' as const } : {})
			})
		)
	);
	// Without grouping, the watched titles are in the list above
	const watched = usePageInfiniteQuery(
		derived([filters, libraryViewSettings], ([$filters, $libraryViewSettings]) => ({
			...catalogQueries.myList({ ...$filters, status: 'watched' }),
			enabled: $libraryViewSettings.separateWatched
		}))
	);
	const { loadMore: loadMoreUpcoming } = upcoming;
	const { loadMore: loadMoreUnwatched } = unwatched;
	const { loadMore: loadMoreWatched } = watched;

	$: upcomingItems = $upcoming.data ?? [];
	$: unwatchedItems = $unwatched.data ?? [];
	$: watchedItems = ($libraryViewSettings.separateWatched && $watched.data) || [];
	$: error = $upcoming.error ?? $unwatched.error ?? $watched.error;

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
		libraryViewSettings.update((settings) =>
			settings.order === order
				? { ...settings, direction: settings.direction === 'asc' ? 'desc' : 'asc' }
				: { ...settings, order, direction: NATURAL[order] }
		);
	}

	function toggleSeparateWatched() {
		libraryViewSettings.update((settings) => ({
			...settings,
			separateWatched: !settings.separateWatched
		}));
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Library</h2>
	<TitleText title="My List" size="sm" />
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
							selected={$libraryViewSettings.separateWatched}
							on:clickOrSelect={toggleSeparateWatched}
							on:enter={scrollIntoView({ horizontal: 64 })}
						>
							Group Watched
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
								selected={$libraryViewSettings.order === option.value}
								on:clickOrSelect={() => selectSort(option.value)}
								on:enter={scrollIntoView({ horizontal: 64 })}
							>
								<span class="flex items-center">
									{option.label}
									{#if $libraryViewSettings.order === option.value}
										<svelte:component
											this={$libraryViewSettings.direction === 'desc' ? ArrowDown : ArrowUp}
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
				on:mount={(e) => {
					didMount = true;
					// registrar(e);
				}}
				focusedChild
				class="flex-1 flex flex-col"
			>
				{#if upcomingItems.length}
					<div class="mt-6">
						<Carousel
							header="Upcoming"
							scrollClass="px-32"
							on:enter={scrollIntoView({ bottom: 0 })}
						>
							{#each upcomingItems as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									on:enter={scrollIntoView({ horizontal: 128 })}
									size="lg"
									item={item.tmdbItem}
									badges={titleBadges(item, { requested: true, movieOnDisk: true })}
								/>
							{/each}
							<div use:loadMoreUpcoming />
						</Carousel>
					</div>
				{/if}
				{#if unwatchedItems.length}
					<div class="my-6">
						{#if $libraryViewSettings.separateWatched}
							<div class="px-32 mb-6 h3">Unwatched</div>
						{/if}
						<CardGrid class="px-32" let:columns on:back={scrollToTop}>
							{#each unwatchedItems as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									item={item.tmdbItem}
									progress={item.lastPlayState?.progress || 0}
									badges={titleBadges(item, { requested: true, movieOnDisk: true })}
									on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
								/>
							{/each}
						</CardGrid>
						<div use:loadMoreUnwatched />
					</div>
				{/if}
				{#if watchedItems.length}
					<div class="mt-6 px-32">
						<div class="mb-6 h3">Watched</div>
						<CardGrid let:columns>
							{#each watchedItems as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									item={item.tmdbItem}
									progress={item.lastPlayState?.progress || 0}
									badges={titleBadges(item, { requested: true, movieOnDisk: true })}
									on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
								/>
							{/each}
						</CardGrid>
						<div use:loadMoreWatched />
					</div>
				{/if}

				{#if !upcomingItems.length && !unwatchedItems.length && !watchedItems.length}
					{#if $upcoming.isLoading || $unwatched.isLoading || $watched.isLoading}
						<Container class="h-ghost m-auto px-32">Loading...</Container>
					{:else if error}
						<Container focusOnMount class="h-ghost m-auto px-32 text-red-400">
							{errorMessage(error)}
						</Container>
					{:else}
						<Container focusOnMount class="h-ghost m-auto px-32">
							{#if $letter}
								Nothing in your list under {$letter}.
							{:else if $category !== 'all'}
								No {$category} in your list.
							{:else}
								Add content to your list to see it here.
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
