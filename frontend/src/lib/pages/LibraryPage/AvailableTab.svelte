<script lang="ts">
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView, scrollToTop } from '$lib/selectable';
	import {
		availableContext,
		type CatalogOrder,
		type CatalogOrderDirection
	} from '$lib/stores/data/library-data.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { ArrowDown, ArrowUp } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
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

	const { category, viewSettings, requested, unrequested, unsubscribe } =
		availableContext.createContext();

	// Selecting the category that is shown shows both again
	function filter(selected: Category) {
		$category = $category === selected ? 'all' : selected;
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

	const { loading: loadingRequested, observer: requestedObserver } = requested;
	const { loading: loadingUnrequested, observer: unrequestedObserver } = unrequested;

	onDestroy(() => {
		unsubscribe();
	});
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Library</h2>
	<TitleText title="Available" size="sm" />
</FloatingHeader>

<Container class="min-h-full pb-16 space-y-8 flex flex-col" let:hasFocus focusOnMount>
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
			{#if $requested.length}
				<div class="my-6">
					{#if $viewSettings.separateRequested}
						<div class="px-32 mb-6 h3">Requested</div>
					{/if}
					<CardGrid class="px-32" let:columns on:back={scrollToTop}>
						{#each $requested as item, index (`${item.mediaType}-${item.tmdbId}`)}
							<TmdbCard
								{index}
								item={item.tmdbItem}
								progress={item.lastPlayState?.progress || 0}
								badges={titleBadges(item, { requested: !$viewSettings.separateRequested })}
								on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
							/>
						{/each}
					</CardGrid>
					<div use:requestedObserver />
				</div>
			{/if}
			{#if $unrequested.length}
				<div class="mt-6 px-32">
					<div class="mb-6 h3">On disk</div>
					<CardGrid let:columns>
						{#each $unrequested as item, index (`${item.mediaType}-${item.tmdbId}`)}
							<TmdbCard
								{index}
								item={item.tmdbItem}
								progress={item.lastPlayState?.progress || 0}
								badges={titleBadges(item)}
								on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
							/>
						{/each}
					</CardGrid>
					<div use:unrequestedObserver />
				</div>
			{/if}

			{#if ($loadingRequested || $loadingUnrequested) && !$requested.length && !$unrequested.length}
				<Container class="h-ghost m-auto px-32">Loading...</Container>
			{:else if !$requested.length && !$unrequested.length}
				<Container focusOnMount class="h-ghost m-auto px-32">
					{#if $category !== 'all'}
						No {$category} on disk.
					{:else}
						Nothing on disk yet.
					{/if}
				</Container>
			{/if}
		</Container>
	</div>
</Container>
