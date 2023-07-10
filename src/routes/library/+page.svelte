<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import RadarrStats from '$lib/components/SourceStats/RadarrStats.svelte';
	import SonarrStats from '$lib/components/SourceStats/SonarrStats.svelte';
	import { library } from '$lib/stores/library.store';
	import { ChevronDown, MagnifyingGlass, TextAlignBottom, Trash } from 'radix-icons-svelte';

	const watched = [];

	const posterGridStyle =
		'grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
	const headerStyle = 'uppercase tracking-widest font-bold';
	const headerContaienr = 'flex items-center justify-between mt-2';

	function sortByAdded(arr: any[]) {
		return arr.sort((a, b) => ((a.added || '') > (b.added || '') ? -1 : 1));
	}

	console.log($library);
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
		<!--	Contains all the titles available locally, the ones already watched previously (greyed out at the-->
		<!--	bottom), and the ones that are in some sort of watchlist and not available via any source.-->

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

		{#await $library}
			<div class={posterGridStyle}>
				{#each [...Array(20).keys()] as index (index)}
					<CardPlaceholder type="dynamic" {index} />
				{/each}
			</div>
		{:then libraryData}
			{@const downloading = sortByAdded([
				...libraryData.movies.filter((m) => !!m.download),
				...libraryData.series.filter((s) => !!s.download)
			])}
			{@const available = sortByAdded([
				...libraryData.movies.filter((m) => !m.download && m.movieFile && m.isAvailable),
				...libraryData.series.filter(
					(s) => !s.download && s.seasons?.find((season) => !!season?.statistics?.episodeFileCount)
				)
			])}
			{@const unavailable = sortByAdded([
				...libraryData.movies.filter((m) => !m.download && (!m.movieFile || !m.isAvailable)),
				...libraryData.series.filter(
					(s) => !s.download && !s.seasons?.find((season) => !!season?.statistics?.episodeFileCount)
				)
			])}

			{#if downloading.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Downloading <span class="text-zinc-500">{downloading.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each downloading as movie (movie)}
						<Card
							type="dynamic"
							progress={movie.download?.progress || 0}
							completionTime={movie.download?.completionTime}
							available={false}
							tmdbId={String(movie.tmdbId)}
							title={movie.title || ''}
							genres={movie.genres || []}
							runtimeMinutes={movie.runtime || 0}
							backdropUrl={movie.cardBackdropUrl}
							rating={movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0}
						/>
					{/each}
				</div>
			{/if}

			{#if available.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Available <span class="text-zinc-500">{available.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each available as movie (movie.tmdbId)}
						<Card
							type="dynamic"
							tmdbId={String(movie.tmdbId)}
							title={movie.title || ''}
							genres={movie.genres || []}
							runtimeMinutes={movie.runtime || 0}
							backdropUrl={movie.cardBackdropUrl}
							rating={movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0}
						/>
					{/each}
				</div>
			{/if}

			{#if unavailable.length > 0}
				<div class={headerContaienr}>
					<h1 class={headerStyle}>
						Unavailable <span class="text-zinc-500">{unavailable.length}</span>
					</h1>
					<IconButton>
						<ChevronDown size={24} />
					</IconButton>
				</div>
				<div class={posterGridStyle}>
					{#each unavailable as movie (movie.tmdbId)}
						<Card
							type="dynamic"
							available={false}
							tmdbId={String(movie.tmdbId)}
							title={movie.title || ''}
							genres={movie.genres || []}
							runtimeMinutes={movie.runtime || 0}
							backdropUrl={movie.cardBackdropUrl}
							rating={movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0}
						/>
					{/each}
				</div>
			{/if}
		{/await}
	</div>
</div>
