<script lang="ts">
	import type { LibraryItemDto } from '$lib/apis/reiverr/reiverr.openapi';
	import type { TmdbMovieFull2, TmdbSeriesFull2 } from '$lib/apis/tmdb/tmdb-api';
	import Button from '$lib/components/Button.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Container from '$lib/components/Container.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { libraryViewSettings, type LibraryViewSettings } from '$lib/stores/localstorage.store';
	import { MixerHorizontal } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import TmdbCard from '../../components/Card/TmdbCard.svelte';
	import CardGrid from '../../components/CardGrid.svelte';
	import DetachedPage from '../../components/DetachedPage/DetachedPage.svelte';
	import { scrollIntoView } from '../../selectable';
	import OptionsDialog from './OptionsDialog.LibraryPage.svelte';
	import TabItem from './TabItem.svelte';

	type LibraryItemWithMetadata = LibraryItemDto & { metadata: TmdbSeriesFull2 | TmdbMovieFull2 };

	let didMount = false;
	let category = writable<'all' | 'series' | 'movies'>('all');

	const { isLoading, unsubscribe, ...libraryItems } = libraryItemsDataStore.subscribe();

	const sortedLibraryItems = derived(
		[libraryItems, libraryViewSettings, category],
		([items, viewSettings, category]) => sortItems(items, viewSettings, category)
	);

	const libraryItemsCategorized = derived(
		[sortedLibraryItems, libraryViewSettings],
		([items, viewSettings]) => {
			let categorizedItems = {
				upcoming: [] as LibraryItemWithMetadata[],
				main: [] as LibraryItemWithMetadata[],
				watched: [] as LibraryItemWithMetadata[]
			};

			if (!viewSettings.separateUpcoming && !viewSettings.separateWatched) {
				return { main: items || [], upcoming: [], watched: [] };
			}

			for (const item of items) {
				const releaseDate = new Date(
					('release_date' in item.metadata && item.metadata.release_date) ||
						(item.watched &&
							'next_episode_to_air' in item.metadata &&
							(item.metadata.next_episode_to_air as any)?.air_date) ||
						0
				);
				const hasFutureReleases = item.watched
					? 'seasons' in item.metadata && item.metadata.seasons?.some((s) => s.air_date === null)
					: 'last_air_date' in item.metadata && item.metadata.last_air_date === null;

				if (viewSettings.separateUpcoming && (releaseDate > new Date() || hasFutureReleases)) {
					categorizedItems.upcoming.push(item);
				} else if (viewSettings.separateWatched && item.watched) {
					categorizedItems.watched.push(item);
				} else {
					categorizedItems.main.push(item);
				}
			}

			categorizedItems.upcoming.sort((a, b) => {
				const aReleaseDate = new Date(
					('release_date' in a.metadata && a.metadata.release_date) ||
						('next_episode_to_air' in a.metadata &&
							(a.metadata.next_episode_to_air as any)?.air_date) ||
						new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 20
				);

				const bReleaseDate = new Date(
					('release_date' in b.metadata && b.metadata.release_date) ||
						('next_episode_to_air' in b.metadata &&
							(b.metadata.next_episode_to_air as any)?.air_date) ||
						new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 20
				);

				return aReleaseDate > bReleaseDate ? 1 : -1;
			});

			return categorizedItems;
		}
	);

	function sortItems(
		items: LibraryItemWithMetadata[] | undefined,
		viewSettings: LibraryViewSettings,
		category: 'all' | 'series' | 'movies'
	) {
		const filtered =
			category === 'all'
				? items?.slice()
				: items?.filter((i) =>
						category === 'series' ? i.mediaType === 'Series' : i.mediaType === 'Movie'
				  );

		return (
			filtered?.sort((a, b) => {
				const aCreatedAt = a.createdAt;
				const bCreatedAt = b.createdAt;

				const aReleaseDate = ('release_date' in a.metadata && a.metadata.release_date) || '';
				const bReleaseDate = ('release_date' in b.metadata && b.metadata.release_date) || '';

				const aFirstAirDate =
					('first_air_date' in a.metadata && a.metadata.first_air_date) || aReleaseDate;
				const bFirstAirDate =
					('first_air_date' in b.metadata && b.metadata.first_air_date) || bReleaseDate;

				const aLastAirDate =
					('last_air_date' in a.metadata && a.metadata.last_air_date) ||
					aFirstAirDate ||
					aReleaseDate;
				const bLastAirDate =
					('last_air_date' in b.metadata && b.metadata.last_air_date) ||
					bFirstAirDate ||
					bReleaseDate;

				const aTitle =
					('title' in a.metadata && a.metadata.title) ||
					('name' in a.metadata && a.metadata.name) ||
					'';

				const bTitle =
					('title' in b.metadata && b.metadata.title) ||
					('name' in b.metadata && b.metadata.name) ||
					'';

				const direction = viewSettings.sortDirection === 'asc' ? 1 : -1;
				if (viewSettings.sortBy === 'date-added') {
					return direction * aCreatedAt.localeCompare(bCreatedAt);
				} else if (viewSettings.sortBy === 'first-release-date') {
					return direction * aFirstAirDate.localeCompare(bFirstAirDate);
				} else if (viewSettings.sortBy === 'last-release-date') {
					return direction * aLastAirDate.localeCompare(bLastAirDate);
				} else if (viewSettings.sortBy === 'title') {
					return direction * aTitle.localeCompare(bTitle);
				}

				return 0;
			}) || []
		);
	}

	$: viewSettingsKey = $libraryViewSettings && Symbol();

	onDestroy(() => {
		unsubscribe();
	});
</script>

<DetachedPage class="py-16 space-y-8 min-h-screen flex flex-col" let:hasFocus focusOnMount>
	{#if !$isLoading}
		<div class="h-full flex-1 flex flex-col">
			<Container class="px-32 flex items-center justify-between" direction="horizontal">
				<Container class="flex space-x-4" direction="horizontal">
					<TabItem selected={$category === 'all'} on:select={() => category.set('all')}>All</TabItem
					>
					<TabItem selected={$category === 'series'} on:select={() => category.set('series')}>
						Series
					</TabItem>
					<TabItem selected={$category === 'movies'} on:select={() => category.set('movies')}>
						Movies
					</TabItem>
				</Container>
				<Button icon={MixerHorizontal} on:clickOrSelect={() => createModal(OptionsDialog, {})}>
					Options
				</Button>
			</Container>
			<Container
				focusOnMount={hasFocus || !didMount}
				on:mount={() => (didMount = true)}
				focusedChild
			>
				{#if $libraryItemsCategorized.main.length + $libraryItemsCategorized.upcoming.length + $libraryItemsCategorized.watched.length}
					{#if $libraryItemsCategorized.upcoming.length}
						<div class="mt-6">
							<Carousel
								header="Upcoming"
								scrollClass="px-32"
								on:enter={scrollIntoView({ bottom: 0 })}
							>
								{#key viewSettingsKey}
									{#each $libraryItemsCategorized.upcoming as item (item.tmdbId)}
										<TmdbCard
											on:enter={scrollIntoView({ horizontal: 128 })}
											size="lg"
											item={item.metadata}
										/>
									{/each}
								{/key}
							</Carousel>
						</div>
					{/if}
					{#if $libraryItemsCategorized.main.length}
						<div class="my-6">
							<div class="px-32 mb-6 h3">My Library</div>
							<CardGrid class="px-32">
								{#key viewSettingsKey}
									{#each $libraryItemsCategorized.main as item, index (item.tmdbId)}
										<TmdbCard
											item={item.metadata}
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
					{#if $libraryItemsCategorized.watched.length}
						<div class="mt-6 px-32">
							<div class="mb-6 h3">Watched</div>
							<CardGrid>
								{#key viewSettingsKey}
									{#each $libraryItemsCategorized.watched as item (item.tmdbId)}
										<TmdbCard
											item={item.metadata}
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
				{:else}
					<Container focusOnMount class="h-ghost m-auto">
						You haven't added anything to your library
					</Container>
				{/if}
			</Container>
		</div>
	{/if}
</DetachedPage>
