<script lang="ts">
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView, scrollToTop } from '$lib/selectable';
	import {
		libraryContext,
		type MyListOrder,
		type MyListOrderDirection
	} from '$lib/stores/data/library-data.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { ArrowDown, ArrowUp } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import TmdbCard from '../../components/Card/TmdbCard.svelte';
	import CardGrid from '../../components/CardGrid.svelte';

	type Category = 'series' | 'movies';

	const CATEGORIES: { label: string; value: Category }[] = [
		{ label: 'Series', value: 'series' },
		{ label: 'Movies', value: 'movies' }
	];
	const SORTS: { label: string; value: MyListOrder }[] = [
		{ label: 'Last Release', value: 'last-release-date' },
		{ label: 'First Release', value: 'first-release-date' },
		{ label: 'Date Added', value: 'date-added' },
		{ label: 'Name', value: 'name' }
	];
	// The direction a sort starts in: newest, A to Z
	const NATURAL: Record<MyListOrder, MyListOrderDirection> = {
		'last-release-date': 'desc',
		'first-release-date': 'desc',
		'date-added': 'desc',
		name: 'asc'
	};

	const { topVisible } = getScrollContext();

	let didMount = false;
	// let category: 'all' | 'series' | 'movies' = 'all';

	const { category, libraryViewSettings, upcoming, unwatched, watched, unsubscribe } =
		libraryContext.createContext();

	// Selecting the category that is shown shows both again
	function filter(selected: Category) {
		$category = $category === selected ? 'all' : selected;
	}

	// One sort is always on; selecting it again turns it around
	function selectSort(order: MyListOrder) {
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

	const { loading: loadingUpcoming, observer: upcomingObserver } = upcoming;
	const { loading: loadingWatched, observer: watchedObserver } = watched;
	const { loading: loadingUnwatched, observer: interactionObserver } = unwatched;

	// const {
	// 	data: upcoming,
	// 	interactionObserver: upcomingObserver,
	// 	load: loadUpcoming,
	// 	isLoading: loadingUpcoming
	// } = usePaginatedRequest(
	// 	async (page) => {
	// 		if (!$user?.id || !$libraryViewSettings.separateWatched) {
	// 			return { items: [], total: 0, itemsPerPage: 0, page: 0 };
	// 		}

	// 		return reiverrApi.myList
	// 			.getMyList($user.id, {
	// 				status: 'upcoming',
	// 				type: category,
	// 				order: $libraryViewSettings.order,
	// 				direction: $libraryViewSettings.direction,
	// 				page
	// 			})
	// 			.then((i) => i.data);
	// 	},
	// 	{
	// 		loadOnInit: false,
	// 		refresher: libraryRefresher
	// 	}
	// );

	// const {
	// 	data: watched,
	// 	interactionObserver: watchedObserver,
	// 	load: loadWatched,
	// 	isLoading: loadingWatched
	// } = usePaginatedRequest(
	// 	async (page) => {
	// 		if (!$user?.id || !$libraryViewSettings.separateWatched) {
	// 			return { items: [], total: 0, itemsPerPage: 0, page: 0 };
	// 		}

	// 		return reiverrApi.myList
	// 			.getMyList($user.id, {
	// 				status: 'watched',
	// 				type: category,
	// 				order: $libraryViewSettings.order,
	// 				direction: $libraryViewSettings.direction,
	// 				page
	// 			})
	// 			.then((i) => i.data);
	// 	},
	// 	{ loadOnInit: false, refresher: libraryRefresher }
	// );

	// const { interactionObserver, data, load, isLoading } = usePaginatedRequest(
	// 	async (page) => {
	// 		if (!$user?.id) {
	// 			return { items: [], total: 0, itemsPerPage: 0, page: 0 };
	// 		}

	// 		return reiverrApi.myList
	// 			.getMyList($user.id, {
	// 				type: category,
	// 				order: $libraryViewSettings.order,
	// 				direction: $libraryViewSettings.direction,
	// 				...($libraryViewSettings.separateWatched ? { status: 'unwatched' } : {}),
	// 				page
	// 			})
	// 			.then((i) => i.data);
	// 	},
	// 	{ loadOnInit: false, refresher: libraryRefresher }
	// );

	// $: {
	// 	$libraryViewSettings;
	// 	category;
	// 	$user;
	// 	load({ lazy: true });
	// 	loadUpcoming({ lazy: true });
	// 	loadWatched({ lazy: true });
	// }

	onDestroy(() => {
		unsubscribe();
	});
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Library</h2>
	<TitleText title="My List" size="sm" />
</FloatingHeader>

<Container class="min-h-full pb-16 space-y-8 flex flex-col" let:hasFocus focusOnMount>
	<div class="h-full flex-1 flex flex-col">
		<Scrollable class="mx-32 flex items-center justify-between space-x-4" fadeWidth={3}>
			<Container direction="horizontal" class="flex flex-shrink-0 space-x-4">
				{#each CATEGORIES as option (option.value)}
					<Pill
						selected={$category === option.value}
						on:clickOrSelect={() => filter(option.value)}
						on:enter={scrollIntoView({ horizontal: 64 })}
					>
						{option.label}
					</Pill>
				{/each}
				<Pill
					selected={$libraryViewSettings.separateWatched}
					on:clickOrSelect={toggleSeparateWatched}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Group Watched
				</Pill>
			</Container>
			<Container direction="horizontal" class="flex flex-shrink-0 space-x-4">
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
			{#if $upcoming.length}
				<div class="mt-6">
					<Carousel header="Upcoming" scrollClass="px-32" on:enter={scrollIntoView({ bottom: 0 })}>
						{#each $upcoming as item, index (item.tmdbId)}
							<TmdbCard
								{index}
								on:enter={scrollIntoView({ horizontal: 128 })}
								size="lg"
								item={item.tmdbItem}
							/>
						{/each}
						<div use:upcomingObserver />
					</Carousel>
				</div>
			{/if}
			{#if $unwatched.length}
				<div class="my-6">
					{#if $libraryViewSettings.separateWatched}
						<div class="px-32 mb-6 h3">Unwatched</div>
					{/if}
					<CardGrid class="px-32" let:columns on:back={scrollToTop}>
						{#each $unwatched as item, index (item.tmdbId)}
							<TmdbCard
								{index}
								item={item.tmdbItem}
								progress={item.lastPlayState?.progress || 0}
								on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
							/>
						{/each}
					</CardGrid>
					<div use:interactionObserver />
				</div>
			{/if}
			{#if $watched.length}
				<div class="mt-6 px-32">
					<div class="mb-6 h3">Watched</div>
					<CardGrid let:columns>
						{#each $watched as item, index (item.tmdbId)}
							<TmdbCard
								{index}
								item={item.tmdbItem}
								progress={item.lastPlayState?.progress || 0}
								on:enter={scrollIntoView({ top: index < columns ? 192 + 64 : 192 })}
							/>
						{/each}
					</CardGrid>
					<div use:watchedObserver />
				</div>
			{/if}

			{#if ($loadingUnwatched || $loadingUpcoming || $loadingWatched) && !$upcoming.length && !$unwatched.length && !$watched.length}
				<Container class="h-ghost m-auto px-32">Loading...</Container>
			{:else if !$upcoming.length && !$unwatched.length && !$watched.length}
				<Container focusOnMount class="h-ghost m-auto px-32">
					{#if $category !== 'all'}
						No {$category} in your list.
					{:else}
						Add content to your list to see it here.
					{/if}
				</Container>
			{/if}

			<!-- {#await Promise.all([upcoming, items, watched]) then [upcoming, items, watched]}
				{#if !upcoming.length && !items.length && !watched.length}
					<Container focusOnMount class="h-ghost m-auto px-32">
						Add content to your list to see it here.
					</Container>
				{/if}
			{:catch error}
				<Container class="h-ghost m-auto px-32">
					<div class="text-red-500">Error loading data: {error.message}</div>
				</Container>
			{/await} -->
		</Container>
	</div>
</Container>
