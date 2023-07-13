<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import RadarrStats from '$lib/components/SourceStats/RadarrStats.svelte';
	import SonarrStats from '$lib/components/SourceStats/SonarrStats.svelte';
	import {
		library,
		type PlayableRadarrMovie,
		type PlayableSonarrSeries
	} from '$lib/stores/library.store';
	import { ChevronDown, MagnifyingGlass, TextAlignBottom, Trash } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';

	const posterGridStyle =
		'grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
	const headerStyle = 'uppercase tracking-widest font-bold';
	const headerContaienr = 'flex items-center justify-between mt-2';

	let itemsVisible: 'all' | 'movies' | 'shows' = 'all';
	let sortBy: 'added' | 'rating' | 'year' | 'size' | 'name' = 'added';

	let loading = true;
	let downloadingProps: ComponentProps<Card>[] = [];
	let availableProps: ComponentProps<Card>[] = [];
	let watchedProps: ComponentProps<Card>[] = [];
	let unavailableProps: ComponentProps<Card>[] = [];

	function itemIsSeries(
		item: PlayableRadarrMovie | PlayableSonarrSeries
	): item is PlayableSonarrSeries {
		return (item as PlayableSonarrSeries).seasons !== undefined;
	}

	function itemIsMovie(
		item: PlayableRadarrMovie | PlayableSonarrSeries
	): item is PlayableRadarrMovie {
		return (item as PlayableRadarrMovie).isAvailable !== undefined;
	}

	library.subscribe(async (libraryPromise) => {
		const libraryData = await libraryPromise;

		const items = filterItems(sortItems([...libraryData.movies, ...libraryData.series]));

		for (let item of items) {
			let props: ComponentProps<Card>;
			if (itemIsSeries(item)) {
				console.log(item);
				props = {
					size: 'dynamic',
					type: 'series',
					tmdbId: String(item.tmdbId),
					title: item.title || '',
					genres: item.genres || [],
					backdropUrl: item.cardBackdropUrl,
					rating: item.ratings?.value || item.ratings?.value || item.tmdbRating || 0,
					seasons: item.seasons?.length || 0
				};
			} else if (itemIsMovie(item)) {
				props = {
					size: 'dynamic',
					type: 'movie',
					tmdbId: String(item.tmdbId),
					title: item.title || '',
					genres: item.genres || [],
					backdropUrl: item.cardBackdropUrl,
					rating: item.ratings?.tmdb?.value || item.ratings?.imdb?.value || 0,
					runtimeMinutes: item.runtime || 0
				};
			} else {
				continue;
			}

			if (item.download) {
				downloadingProps.push({
					...props,
					progress: item.download.progress,
					completionTime: item.download.completionTime
				});
			} else if (item.isPlayed) {
				watchedProps.push({ ...props, available: false });
			} else if (
				((item as PlayableRadarrMovie)?.isAvailable && (item as PlayableRadarrMovie)?.movieFile) ||
				(item as PlayableSonarrSeries)?.seasons?.find(
					(season) => !!season?.statistics?.episodeFileCount
				)
			) {
				availableProps.push(props);
			} else {
				unavailableProps.push({ ...props, available: false });
			}
		}

		downloadingProps = downloadingProps;
		availableProps = availableProps;
		watchedProps = watchedProps;
		unavailableProps = unavailableProps;

		loading = false;
	});

	function sortItems(arr: any[]) {
		return arr.sort((a, b) => ((a.added || '') > (b.added || '') ? -1 : 1));
	}

	function filterItems(arr: any[]) {
		return arr;
	}
</script>

<div class="pt-24 pb-8 px-8 bg-black">
	<div class="max-w-screen-2xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 items-center justify-center gap-4">
			<RadarrStats />
			<SonarrStats />
		</div>
	</div>
</div>

<div class="py-4 px-8">
	<div class="max-w-screen-2xl m-auto backdrop-blur-2xl flex flex-col gap-4">
		<div class="flex justify-between gap-2 sm:flex-row flex-col">
			<div
				class="flex gap-2 items-center bg-stone-950 rounded-2xl p-3 px-4 shadow-xl focus-within:outline outline-2 outline-stone-400"
			>
				<MagnifyingGlass size={24} class="text-zinc-200" />
				<input
					type="text"
					class="bg-transparent outline-none text-zinc-300"
					placeholder="Search from library"
				/>
			</div>
			<div class="flex items-center gap-2 bg-stone-950 rounded-2xl p-3 px-5 shadow-lg">
				<IconButton>
					<TextAlignBottom size={20} />
				</IconButton>
				<IconButton>
					<Trash size={20} />
				</IconButton>
			</div>
		</div>

		<!-- <div class="flex justify-between">
			<div class="flex gap-2 items-center">
				<MagnifyingGlass size={28} class="text-zinc-400" />
				<input
					type="text"
					class="bg-transparent outline-none font-light text-zinc-200 border-b border-b-zinc-400 text-sm"
				/>
			</div>
			<div class="flex items-center gap-2 bg-stone-950 rounded-full p-3 px-5 shadow-lg">
				<IconButton>
					<TextAlignBottom size={20} />
				</IconButton>
				<IconButton>
					<Trash size={20} />
				</IconButton>
			</div>
		</div> -->

		{#if loading}
			<div class={posterGridStyle}>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder size="dynamic" {index} />
				{/each}
			</div>
		{:else}
			{#if downloadingProps.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Downloading <span class="text-zinc-500">{downloadingProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each downloadingProps as props}
						<Card {...props} />
					{/each}
				</div>
			{/if}

			{#if availableProps.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Available <span class="text-zinc-500">{availableProps.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each availableProps as props}
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
					{#each watchedProps as props}
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
					{#each unavailableProps as props}
						<Card {...props} />
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
