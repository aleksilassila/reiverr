<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView, scrollToTop } from '$lib/selectable';
	import { libraryRefresher, usePaginatedRequest } from '$lib/stores/data.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { MixerHorizontal } from 'radix-icons-svelte';
	import TmdbCard from '../../components/Card/TmdbCard.svelte';
	import CardGrid from '../../components/CardGrid.svelte';
	import { libraryViewSettings } from './LibraryPage';
	import MyListOptions from './MyListOptions.svelte';
	import TabItem from './TabItem.svelte';

	const { topVisible } = getScrollContext();

	let didMount = false;
	let category: 'all' | 'series' | 'movies' = 'all';

	const {
		data: upcoming,
		interactionObserver: upcomingObserver,
		load: loadUpcoming,
		isLoading: loadingUpcoming
	} = usePaginatedRequest(
		async (page) => {
			if (!$user?.id || !$libraryViewSettings.separateWatched) {
				return { items: [], total: 0, itemsPerPage: 0, page: 0 };
			}

			return reiverrApi.library
				.getMyList($user.id, {
					status: 'upcoming',
					type: category,
					order: $libraryViewSettings.order,
					direction: $libraryViewSettings.direction,
					page
				})
				.then((i) => i.data);
		},
		{
			loadOnInit: false,
			refresher: libraryRefresher
		}
	);

	const {
		data: watched,
		interactionObserver: watchedObserver,
		load: loadWatched,
		isLoading: loadingWatched
	} = usePaginatedRequest(
		async (page) => {
			if (!$user?.id || !$libraryViewSettings.separateWatched) {
				return { items: [], total: 0, itemsPerPage: 0, page: 0 };
			}

			return reiverrApi.library
				.getMyList($user.id, {
					status: 'watched',
					type: category,
					order: $libraryViewSettings.order,
					direction: $libraryViewSettings.direction,
					page
				})
				.then((i) => i.data);
		},
		{ loadOnInit: false, refresher: libraryRefresher }
	);

	const { interactionObserver, data, load, isLoading } = usePaginatedRequest(
		async (page) => {
			if (!$user?.id) {
				return { items: [], total: 0, itemsPerPage: 0, page: 0 };
			}

			return reiverrApi.library
				.getMyList($user.id, {
					type: category,
					order: $libraryViewSettings.order,
					direction: $libraryViewSettings.direction,
					...($libraryViewSettings.separateWatched ? { status: 'unwatched' } : {}),
					page
				})
				.then((i) => i.data);
		},
		{ loadOnInit: false, refresher: libraryRefresher }
	);

	$: {
		$libraryViewSettings;
		category;
		$user;
		load({ lazy: true });
		loadUpcoming({ lazy: true });
		loadWatched({ lazy: true });
	}
</script>

<FloatingHeader visible={$topVisible} class="px-32">
	<h2 class="uppercase text-zinc-300 font-semibold tracking-wider text-base">Library</h2>
	<TitleText title="My List" size="sm" />
</FloatingHeader>

<Container class="min-h-full pb-16 space-y-8 flex flex-col" let:hasFocus focusOnMount>
	<div class="h-full flex-1 flex flex-col">
		<Container class="px-32 flex space-x-4 items-center justify-between" direction="horizontal">
			<Container
				class="flex space-x-4"
				direction="horizontal"
				on:blur={({ detail: selectable }) => {
					selectable.activateChild(category === 'all' ? 0 : category === 'series' ? 1 : 2);
				}}
			>
				<TabItem selected={category === 'all'} on:select={() => (category = 'all')}>All</TabItem>
				<TabItem selected={category === 'series'} on:select={() => (category = 'series')}>
					Series
				</TabItem>
				<TabItem selected={category === 'movies'} on:select={() => (category = 'movies')}>
					Movies
				</TabItem>
			</Container>
			<Button icon={MixerHorizontal} on:clickOrSelect={() => createModal(MyListOptions, {})}>
				Options
			</Button>
		</Container>
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
			{#if $data.length}
				<div class="my-6">
					{#if $libraryViewSettings.separateWatched}
						<div class="px-32 mb-6 h3">Unwatched</div>
					{/if}
					<CardGrid class="px-32" let:columns on:back={scrollToTop}>
						{#each $data as item, index (item.tmdbId)}
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

			{#if ($isLoading || $loadingUpcoming || $loadingWatched) && !$upcoming.length && !$data.length && !$watched.length}
				<Container class="h-ghost m-auto px-32">Loading...</Container>
			{:else if !$upcoming.length && !$data.length && !$watched.length}
				<Container focusOnMount class="h-ghost m-auto px-32">
					Add content to your list to see it here.
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
