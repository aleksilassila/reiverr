<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import UiCarousel from '$lib/components/Carousel/UICarousel.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import { TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { library, type PlayableItem } from '$lib/stores/library.store';
	import { settings } from '$lib/stores/settings.store';
	import classNames from 'classnames';
	import { CaretDown, Gear } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { fade } from 'svelte/transition';

	let itemsVisible: 'all' | 'movies' | 'shows' = 'all';
	let sortBy: 'added' | 'rating' | 'release' | 'size' | 'name' = 'name';

	let loading = true;
	let noItems = false;
	let searchInput: HTMLInputElement | undefined;
	let searchInputValue = '';

	let openNextUpTab: 'downloading' | 'nextUp' = 'downloading';
	let openTab: 'available' | 'watched' | 'unavailable' = 'available';

	let items: PlayableItem[] = [];

	let downloadingProps: ComponentProps<Card>[] = [];
	let availableProps: ComponentProps<Card>[] = [];
	let watchedProps: ComponentProps<Card>[] = [];
	let unavailableProps: ComponentProps<Card>[] = [];

	let nextUpProps: ComponentProps<Card>[] = [];

	$: if (items.length) updateComponentProps(searchInputValue);
	$: if (!downloadingProps.length && nextUpProps.length) openNextUpTab = 'nextUp';

	library.subscribe(async (libraryPromise) => {
		const libraryData = await libraryPromise;
		items = libraryData.itemsArray;
		loading = false;
		noItems = !items.length;
	});

	function getComponentProps(item: PlayableItem) {
		let props: ComponentProps<Card> | undefined;

		const series = item.sonarrSeries;
		const movie = item.radarrMovie;

		if (item.type === 'series') {
			props = {
				size: 'dynamic',
				type: 'series',
				tmdbId: item.tmdbId,
				title: series?.title || item.jellyfinItem?.Name || '',
				genres: series?.genres || [],
				backdropUrl: item.backdropUrl,
				rating: series?.ratings?.value || series?.ratings?.value || item.tmdbRating || 0,
				seasons: series?.seasons?.length || 0,
				progress: item.nextJellyfinEpisode?.UserData?.PlayedPercentage || undefined
			};
		} else if (item.type === 'movie') {
			props = {
				size: 'dynamic',
				type: 'movie',
				tmdbId: item.tmdbId,
				title: movie?.title || item.jellyfinItem?.Name || '',
				genres: movie?.genres || [],
				backdropUrl: item.backdropUrl,
				rating: movie?.ratings?.tmdb?.value || movie?.ratings?.imdb?.value || 0,
				runtimeMinutes: movie?.runtime || 0,
				progress: item.jellyfinItem?.UserData?.PlayedPercentage || undefined
			};
		} else props = undefined;

		return props;
	}

	function sortItems(items: PlayableItem[], criteria: typeof sortBy) {
		return items.sort((a, b) => {
			switch (criteria) {
				case 'added':
					return (b.radarrMovie?.added || b.sonarrSeries?.added || '') <
						(a.radarrMovie?.added || a.sonarrSeries?.added || '')
						? -1
						: 1;
				case 'rating':
					return (b.tmdbRating || 0) - (a.tmdbRating || 0);
				case 'release':
					return (b.radarrMovie?.inCinemas || b.sonarrSeries?.firstAired || '') <
						(a.radarrMovie?.inCinemas || a.sonarrSeries?.firstAired || '')
						? -1
						: 1;
				case 'size':
					return (
						(b.radarrMovie?.sizeOnDisk || b.sonarrSeries?.statistics?.sizeOnDisk || 0) -
						(a.radarrMovie?.sizeOnDisk || a.sonarrSeries?.statistics?.sizeOnDisk || 0)
					);
				case 'name':
					return (b.radarrMovie?.title?.toLowerCase() ||
						b.sonarrSeries?.title?.toLowerCase() ||
						'') >
						(a.radarrMovie?.title?.toLowerCase() || a.sonarrSeries?.title?.toLowerCase() || '')
						? -1
						: 1;
			}

			return 0;
		});
	}

	function updateComponentProps(searchInputValue: string) {
		const nextUpItems = sortItems([...items], 'added')
			.filter(
				(item) =>
					(!item.isPlayed && item?.radarrMovie?.isAvailable && item?.radarrMovie?.movieFile) ||
					item?.sonarrSeries?.seasons?.find((season) => !!season?.statistics?.episodeFileCount)
			)
			.splice(0, 6);

		const libraryItems = sortItems([...items], sortBy).filter((item) => {
			if (searchInputValue) {
				return (
					item.radarrMovie?.title?.toLowerCase().includes(searchInputValue.toLowerCase()) ||
					item.sonarrSeries?.title?.toLowerCase().includes(searchInputValue.toLowerCase())
				);
			} else {
				return true;
			}
		});

		downloadingProps = [];
		availableProps = [];
		watchedProps = [];
		unavailableProps = [];
		nextUpProps = [];

		for (let item of libraryItems) {
			let props = getComponentProps(item);

			if (!props) continue;

			if (item.download) {
				downloadingProps.push({
					...props,
					progress: item.download.progress,
					completionTime: item.download.completionTime
				});
			} else if (item.isPlayed) {
				watchedProps.push({ ...props, available: false });
			} else if (
				(item.type === 'movie' && item.jellyfinItem?.RunTimeTicks) ||
				item.jellyfinEpisodes?.length
			) {
				availableProps.push(props);
			} else {
				unavailableProps.push({ ...props, available: false });
			}
		}

		for (let item of nextUpItems) {
			let props = getComponentProps(item);

			if (!props) continue;

			nextUpProps.push(props);
		}

		downloadingProps = downloadingProps;
		availableProps = availableProps;
		watchedProps = watchedProps;
		unavailableProps = unavailableProps;
		nextUpProps = nextUpProps;
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			searchInput?.focus();
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} />

{#if noItems}
	<div class="h-screen flex items-center justify-center text-zinc-500 p-8">
		<h1>Configure Radarr, Sonarr and Jellyfin to view and manage your library.</h1>
	</div>
{:else}
	<div
		style={"background-image: url('" +
			TMDB_IMAGES_ORIGINAL +
			(downloadingProps[0]?.backdropUrl || nextUpProps[0]?.backdropUrl) +
			"');"}
		class="absolute inset-0 h-[50vh] bg-center bg-cover"
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-80% to-darken" />
	</div>

	<div
		class="pt-24 pb-4 px-2 md:px-8 relative bg-center bg-cover"
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<div class="relative grid grid-cols-3 grid-rows-3 z-[1] max-w-screen-2xl mx-auto">
			<div class="col-start-1 row-start-2 row-span-2 col-span-3 flex justify-end flex-col">
				{#if downloadingProps.length || nextUpProps.length}
					<Carousel>
						<div slot="title" class="flex items-center gap-6 font-medium text-xl text-zinc-400">
							{#if downloadingProps.length}
								<button
									class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
										'text-zinc-200': openNextUpTab === 'downloading'
									})}
									on:click={() => (openNextUpTab = 'downloading')}
								>
									Download Queue
								</button>
							{/if}
							{#if nextUpProps.length}
								<button
									class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
										'text-zinc-200': openNextUpTab === 'nextUp'
									})}
									on:click={() => (openNextUpTab = 'nextUp')}
								>
									Next Up
								</button>
							{/if}
						</div>
						{#if downloadingProps.length && openNextUpTab === 'downloading'}
							{#each downloadingProps as props (props.tmdbId)}
								<Card {...props} size="md" />
							{/each}
						{:else if openNextUpTab === 'nextUp'}
							{#each nextUpProps as props (props.tmdbId)}
								<Card {...props} size="md" />
							{/each}
						{/if}
					</Carousel>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="py-4 px-2 md:px-8"
		in:fade|global={{
			duration: $settings.animationDuration,
			delay: $settings.animationDuration
		}}
		out:fade|global={{ duration: $settings.animationDuration }}
	>
		<div class="max-w-screen-2xl m-auto flex flex-col gap-4">
			<div class="flex items-center justify-between gap-2">
				<UiCarousel>
					<div class="flex gap-6 text-lg font-medium text-zinc-400">
						<button
							class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
								'text-zinc-200': openTab === 'available'
							})}
							on:click={() => (openTab = 'available')}
						>
							Available
						</button>
						<button
							class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
								'text-zinc-200': openTab === 'watched'
							})}
							on:click={() => (openTab = 'watched')}
						>
							Watched
						</button>
						<button
							class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
								'text-zinc-200': openTab === 'unavailable'
							})}
							on:click={() => (openTab = 'unavailable')}
						>
							Unavailable
						</button>
					</div>
				</UiCarousel>
				<div class="flex items-center gap-3 justify-end flex-shrink-0 flex-initial relative">
					<IconButton>
						<div class="flex gap-0.5 items-center text-sm">
							<span>By Title</span>
							<CaretDown size={20} />
						</div>
					</IconButton>
					<IconButton>
						<Gear size={20} />
					</IconButton>
				</div>
			</div>

			{#if loading}
				<div
					class="grid gap-x-2 sm:gap-x-4 gap-y-4 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
				>
					{#each [...Array(20).keys()] as index (index)}
						<CardPlaceholder size="dynamic" {index} />
					{/each}
				</div>
			{:else}
				<div
					class="grid gap-x-2 sm:gap-x-4 gap-y-4 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
				>
					{#each { available: availableProps, watched: watchedProps, unavailable: unavailableProps }[openTab] as props (props.tmdbId)}
						<Card {...props} />
					{:else}
						<div class="flex-1 flex items-center text-zinc-500">No items.</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
