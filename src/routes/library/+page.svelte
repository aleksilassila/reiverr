<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import { TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { library, type PlayableItem } from '$lib/stores/library.store';
	import { settings } from '$lib/stores/settings.store';
	import { CaretDown, ChevronDown, Gear } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { fade } from 'svelte/transition';

	let itemsVisible: 'all' | 'movies' | 'shows' = 'all';
	let sortBy: 'added' | 'rating' | 'release' | 'size' | 'name' = 'name';

	let loading = true;
	let searchInput: HTMLInputElement | undefined;
	let searchInputValue = '';

	let items: PlayableItem[] = [];

	let downloadingProps: ComponentProps<Card>[] = [];
	let availableProps: ComponentProps<Card>[] = [];
	let watchedProps: ComponentProps<Card>[] = [];
	let unavailableProps: ComponentProps<Card>[] = [];

	let nextUpProps: ComponentProps<Card>[] = [];

	$: {
		if (items.length) updateComponentProps(searchInputValue);
	}

	library.subscribe(async (libraryPromise) => {
		const libraryData = await libraryPromise;
		items = libraryData.itemsArray;
		loading = false;
	});

	function getComponentProps(item: PlayableItem) {
		let props: ComponentProps<Card> | undefined;

		const series = item.sonarrSeries;
		const movie = item.radarrMovie;

		if (series) {
			props = {
				size: 'dynamic',
				type: 'series',
				tmdbId: item.tmdbId,
				title: series.title || '',
				genres: series.genres || [],
				backdropUri: item.cardBackdropUrl,
				rating: series.ratings?.value || series.ratings?.value || item.tmdbRating || 0,
				seasons: series.seasons?.length || 0,
				jellyfinId: item.sonarrSeries?.statistics?.sizeOnDisk ? item.jellyfinId : undefined
			};
		} else if (movie) {
			props = {
				size: 'dynamic',
				type: 'movie',
				tmdbId: item.tmdbId,
				title: movie.title || '',
				genres: movie.genres || [],
				backdropUri: item.cardBackdropUrl,
				rating: movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0,
				runtimeMinutes: movie.runtime || 0,
				jellyfinId: item.radarrMovie?.movieFile ? item.jellyfinId : undefined
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

			const series = item.sonarrSeries;
			const movie = item.radarrMovie;

			if (item.download) {
				downloadingProps.push({
					...props,
					progress: item.download.progress,
					completionTime: item.download.completionTime
				});
			} else if (item.isPlayed) {
				watchedProps.push({ ...props, available: false });
			} else if (
				(movie?.isAvailable && movie?.movieFile) ||
				series?.seasons?.find((season) => !!season?.statistics?.episodeFileCount)
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

	const posterGridStyle =
		'grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
	const headerStyle = 'uppercase tracking-widest font-bold';
	const headerContaienr = 'flex items-center justify-between mt-2';
</script>

<svelte:window on:keydown={handleShortcuts} />

<div
	class="pt-24 pb-4 px-2 md:px-8 bg-black relative bg-center bg-cover"
	style={"background-image: url('" +
		TMDB_IMAGES_ORIGINAL +
		(downloadingProps[0]?.backdropUri || nextUpProps[0]?.backdropUri) +
		// '/4ke48uabb0K6uDcLlSED2ZvvYEb.jpg' +
		"');"}
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-30% to-darken" />
	<!-- <div class="max-w-screen-2xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 items-center justify-center gap-4">
			<RadarrStats />
			<SonarrStats />
		</div>
	</div> -->
	<div class="relative grid grid-cols-3 grid-rows-3 z-[1] max-w-screen-2xl mx-auto">
		<div class="col-start-1 row-start-2 row-span-2 col-span-3 flex justify-end flex-col">
			<!-- <div class="flex flex-col gap-2">
				<div class="text-lg font-semibold">Downloading Now</div>
				<Card {...downloadingProps[0] || unavailableProps[0]} size="md" />
			</div> -->
			{#if downloadingProps.length}
				<Carousel heading="Downloading Queue">
					{#each downloadingProps as props (props.tmdbId)}
						<Card {...props} size="md" />
					{/each}
				</Carousel>
			{:else}
				<Carousel heading="Next Up">
					{#each nextUpProps as props (props.tmdbId)}
						<Card {...props} size="md" />
					{:else}
						<CarouselPlaceholderItems />
					{/each}
				</Carousel>
			{/if}
		</div>
		<!-- <div class="col-start-3 row-span-3 flex justify-end items-end">
			<div class="flex flex-col px-4 py-2 gap-2">
				<div class="font-medium text-lg">Library Stats</div>
				<div class="grid grid-cols-[1fr_max-content] gap-x-16">
					<h1 class="text-zinc-400">Movies</h1>
					<div class="text-right">23</div>
					<h1 class="text-zinc-400">Shows</h1>
					<div class="text-right">10</div>
					<h1 class="text-zinc-400">Disk Space Used</h1>
					<div class="text-right">252.34 GB</div>
					<h1 class="text-zinc-400">Disk Space Left</h1>
					<div class="text-right">84.52 GB</div>
				</div>
				<div class="font-medium border-b border-zinc-500 py-1 text-lg">Stats</div>
				<div class="px-1 py-2 grid grid-cols-[1fr_max-content] gap-x-16">
					<h1 class="text-zinc-300">Movies</h1>
					<div class="text-right">23</div>
					<h1 class="text-zinc-300">Shows</h1>
					<div class="text-right">10</div>
					<h1 class="text-zinc-300">Disk Space Used</h1>
					<div class="text-right">252.34 GB</div>
					<h1 class="text-zinc-300">Disk Space Left</h1>
					<div class="text-right">84.52 GB</div>
				</div>
				<div class="font-medium border-b border-zinc-500 py-0.5">Events</div>
				<div class="text-zinc-400 text-sm pl-1 pt-2 pb-12 pr-40">No recent events</div>
			</div>
		</div> -->
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
		<div class="flex items-center justify-between">
			<div class="flex gap-6 text-lg font-medium text-zinc-400">
				<div class="text-zinc-200">Available</div>
				<div>Watched</div>
				<div>Unavailable</div>
			</div>
			<div class="flex items-center gap-3">
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

		<!-- <div class="flex justify-between gap-2 sm:flex-row flex-col">
			<div
				class={classNames(
					'relative items-center shadow-xl selectable rounded-xl',
					'text-zinc-200 bg-zinc-400 bg-opacity-20 cursor-text focus-within:bg-opacity-30'
				)}
			>
				<div class="absolute inset-y-0 left-4 flex items-center justify-center">
					<MagnifyingGlass size={24} />
				</div>
				<input
					type="text"
					class="bg-transparent outline-none placeholder:text-zinc-400 py-3 pl-12 pr-4 relative z-[1]"
					placeholder="Search from library"
					bind:this={searchInput}
					bind:value={searchInputValue}
				/>
			</div>
		</div> -->

		{#if loading}
			<div class={posterGridStyle}>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder size="dynamic" {index} />
				{/each}
			</div>
		{:else}
			<!-- {#if downloadingProps.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Downloading <span class="text-zinc-500">{downloadingProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each downloadingProps as props (props.tmdbId)}
						<Card {...props} />
					{/each}
				</div>
			{/if} -->

			{#if availableProps.length > 0}
				<!-- <div class={headerContaienr}>
					<h1 class={headerStyle}>
						Available <span class="text-zinc-500">{availableProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div> -->
				<div class={posterGridStyle}>
					{#each availableProps as props (props.tmdbId)}
						<Card {...props} />
					{/each}
				</div>
			{/if}

			{#if watchedProps.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Watched <span class="text-zinc-500">{watchedProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each watchedProps as props (props.tmdbId)}
						<Card {...props} />
					{/each}
				</div>
			{/if}

			{#if unavailableProps.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Unavailable <span class="text-zinc-500">{unavailableProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each unavailableProps as props (props.tmdbId)}
						<Card {...props} />
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
