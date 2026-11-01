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
		type CatalogOrderDirection,
		type MyListAvailability,
		type MyListOrder
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

	/** The titles of the list with an aired episode left to watch, or with none */
	export let status: 'unwatched' | 'watched';

	type Category = 'series' | 'movies';

	const CATEGORIES: { label: string; value: Category }[] = [
		{ label: 'Series', value: 'series' },
		{ label: 'Movies', value: 'movies' }
	];
	const AVAILABILITIES: { label: string; value: MyListAvailability }[] = [
		{ label: 'Available', value: 'available' },
		{ label: 'Unavailable', value: 'unavailable' }
	];
	const SORTS: { label: string; value: MyListOrder }[] = [
		{ label: 'Last Release', value: 'last-release-date' },
		{ label: 'First Release', value: 'first-release-date' },
		{ label: 'Last Played', value: 'last-played' },
		{ label: 'Date Added', value: 'date-added' },
		{ label: 'Name', value: 'name' }
	];
	// The direction a sort starts in: newest, A to Z
	const NATURAL: Record<MyListOrder, CatalogOrderDirection> = {
		'last-release-date': 'desc',
		'first-release-date': 'desc',
		'last-played': 'desc',
		'date-added': 'desc',
		name: 'asc'
	};

	const { topVisible } = getScrollContext();

	let didMount = false;

	const category = writable<CatalogCategory>('all');
	const availability = writable<MyListAvailability | null>(null);
	const letter = writable<Letter | null>(null);
	const viewSettings = createLocalStorageStore<{
		order: MyListOrder;
		direction: CatalogOrderDirection;
	}>(`my-list-${status}-view-settings`, {
		order: 'last-release-date',
		direction: 'desc'
	});

	const titles = usePageInfiniteQuery(
		derived(
			[category, availability, letter, viewSettings],
			([$category, $availability, $letter, $viewSettings]) =>
				catalogQueries.myList({
					status,
					mediaType: mediaTypeOf($category),
					availability: $availability ?? undefined,
					letter: $letter ?? undefined,
					order: $viewSettings.order,
					direction: $viewSettings.direction
				})
		)
	);
	const { loadMore } = titles;

	$: items = $titles.data ?? [];

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	// Selecting the category that is shown shows both again
	function filter(selected: Category) {
		$category = $category === selected ? 'all' : selected;
	}

	// Selecting the availability that is on turns the filter off
	function filterAvailability(selected: MyListAvailability) {
		$availability = $availability === selected ? null : selected;
	}

	// Selecting the letter that is on turns the filter off
	function filterLetter(index: number) {
		const selected = LETTERS[index] ?? null;
		$letter = $letter === selected ? null : selected;
	}

	// One sort is always on; selecting it again turns it around
	function selectSort(order: MyListOrder) {
		viewSettings.update((settings) =>
			settings.order === order
				? { ...settings, direction: settings.direction === 'asc' ? 'desc' : 'asc' }
				: { ...settings, order, direction: NATURAL[order] }
		);
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">My List</h2>
	<TitleText title={status === 'unwatched' ? 'Unwatched' : 'Watched'} size="sm" />
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
						On Disk
					</div>
					<Container direction="horizontal" class="flex space-x-4">
						{#each AVAILABILITIES as option (option.value)}
							<Pill
								selected={$availability === option.value}
								on:clickOrSelect={() => filterAvailability(option.value)}
								on:enter={scrollIntoView({ horizontal: 64 })}
							>
								{option.label}
							</Pill>
						{/each}
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
				{#if items.length}
					<div class="my-6">
						<CardGrid class="px-32" let:columns on:back={scrollToTop}>
							{#each items as item, index (`${item.mediaType}-${item.tmdbId}`)}
								<TmdbCard
									{index}
									item={item.tmdbItem}
									progress={item.lastPlayState?.progress || 0}
									badges={titleBadges(item, {
										requested: true,
										movieOnDisk: true,
										nextEpisode: true
									})}
									on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
								/>
							{/each}
						</CardGrid>
						<div use:loadMore />
					</div>
				{:else if $titles.isLoading}
					<Container class="h-ghost m-auto px-32">Loading...</Container>
				{:else if $titles.error}
					<Container focusOnMount class="h-ghost m-auto px-32 text-red-400">
						{errorMessage($titles.error)}
					</Container>
				{:else}
					<Container focusOnMount class="h-ghost m-auto px-32">
						{#if $letter}
							Nothing {status} in your list under {$letter}.
						{:else if $availability}
							Nothing {status} and {$availability} in your list.
						{:else if $category !== 'all'}
							No {status} {$category} in your list.
						{:else}
							Nothing {status} in your list.
						{/if}
					</Container>
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
