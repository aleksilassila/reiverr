<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingHeader from '$lib/components/FloatingHeader.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import { getStackRouterControls } from '$lib/components/StackRouter/StackRouter';
	import TitleText from '$lib/components/TitleText.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { MixerHorizontal } from 'radix-icons-svelte';
	import TmdbCard from '../../components/Card/TmdbCard.svelte';
	import CardGrid from '../../components/CardGrid.svelte';
	import { libraryViewSettings } from './LibraryPage';
	import MyListOptions from './MyListOptions.svelte';
	import TabItem from './TabItem.svelte';

	const { registrar } = getStackRouterControls();
	const { topVisible } = getScrollContext();

	let didMount = false;
	let category: 'all' | 'series' | 'movies' = 'all';

	$: upcoming =
		$libraryViewSettings.separateWatched && $user?.id
			? reiverrApi.library
					.getMyList($user.id, {
						status: 'upcoming',
						order: $libraryViewSettings.order,
						type: category,
						direction: $libraryViewSettings.direction
					})
					.then((i) => i.data.items)
			: Promise.resolve([]);

	$: watched =
		$libraryViewSettings.separateWatched && $user?.id
			? reiverrApi.library
					.getMyList($user.id, {
						status: 'watched',
						type: category,
						order: $libraryViewSettings.order,
						direction: $libraryViewSettings.direction
					})
					.then((i) => i.data.items)
			: Promise.resolve([]);

	$: items = $user?.id
		? reiverrApi.library
				.getMyList($user.id, {
					...($libraryViewSettings.separateWatched ? { status: 'unwatched' } : {}),
					type: category,
					order: $libraryViewSettings.order,
					direction: $libraryViewSettings.direction
				})
				.then((i) => i.data.items)
		: Promise.resolve([]);

	$: viewSettingsKey = $libraryViewSettings && Symbol();
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
				registrar(e);
			}}
			focusedChild
			class="flex-1 flex flex-col"
		>
			{#await upcoming then upcoming}
				{#if upcoming.length}
					<div class="mt-6">
						<Carousel
							header="Upcoming"
							scrollClass="px-32"
							on:enter={scrollIntoView({ bottom: 0 })}
						>
							{#key viewSettingsKey}
								{#each upcoming as item (item.tmdbId)}
									<TmdbCard
										on:enter={scrollIntoView({ horizontal: 128 })}
										size="lg"
										item={item.tmdbItem}
									/>
								{/each}
							{/key}
						</Carousel>
					</div>
				{/if}
			{/await}
			{#await items then items}
				{#if items.length}
					<div class="my-6">
						<div class="px-32 mb-6 h3">My List</div>
						<CardGrid class="px-32">
							{#key viewSettingsKey}
								{#each items as item, index (item.tmdbId)}
									<TmdbCard
										item={item.tmdbItem}
										progress={item.playStates?.[0]?.progress || 0}
										on:enter={scrollIntoView(index === 0 ? { top: 128 + 64 } : { vertical: 128 })}
										size="dynamic"
										navigateWithType
									/>
								{/each}
							{/key}
						</CardGrid>
					</div>
				{/if}
			{/await}
			{#await watched then watched}
				{#if watched.length}
					<div class="mt-6 px-32">
						<div class="mb-6 h3">Watched</div>
						<CardGrid>
							{#key viewSettingsKey}
								{#each watched as item (item.tmdbId)}
									<TmdbCard
										item={item.tmdbItem}
										progress={item.playStates?.[0]?.progress || 0}
										on:enter={scrollIntoView({ vertical: 128 })}
										size="dynamic"
										navigateWithType
									/>
								{/each}
							{/key}
						</CardGrid>
					</div>
				{/if}
			{/await}
			{#await Promise.all([upcoming, items, watched]) then [upcoming, items, watched]}
				{#if !upcoming.length && !items.length && !watched.length}
					<Container focusOnMount class="h-ghost m-auto px-32">
						Add content to your list to see it here.
					</Container>
				{/if}
			{:catch error}
				<Container class="h-ghost m-auto px-32">
					<div class="text-red-500">Error loading data: {error.message}</div>
				</Container>
			{/await}
		</Container>
	</div>
</Container>
