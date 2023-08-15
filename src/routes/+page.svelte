<script lang="ts">
	import { getTmdbMovie, getTmdbPopularMovies } from '$lib/apis/tmdb/tmdbApi';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import TitleShowcase from '$lib/components/TitleShowcase/TitleShowcase.svelte';
	import { library } from '$lib/stores/library.store';
	import type { ComponentProps } from 'svelte';

	let continueWatchingVisible = true;

	const tmdbPopularMoviesPromise = getTmdbPopularMovies()
		.then((movies) => Promise.all(movies.map((movie) => getTmdbMovie(movie.id || 0))))
		.then((movies) => movies.filter((m) => !!m).slice(0, 10));

	let continueWatchingProps: Promise<(ComponentProps<Poster> & { runtime: number })[]> = $library
		.then((libraryData) => libraryData.continueWatching)
		.then((items) =>
			items.map((item) =>
				item.type === 'movie'
					? {
							type: 'movie',
							tmdbId: item.tmdbId || 0,
							jellyfinId: item.jellyfinId,
							backdropUrl: item.posterUrl || '',
							title: item.radarrMovie?.title || item.jellyfinItem?.Name || '',
							subtitle: item.radarrMovie?.genres?.join(', ') || '',
							progress: item.continueWatching?.progress,
							runtime: item.radarrMovie?.runtime || 0
					  }
					: {
							tmdbId: item.tmdbId || 0,
							jellyfinId: item.nextJellyfinEpisode?.Id,
							type: 'series',
							backdropUrl: item.posterUrl || '',
							title: item.nextJellyfinEpisode?.Name || item.sonarrSeries?.title || '',
							subtitle:
								(item.nextJellyfinEpisode?.IndexNumber &&
									'Episode ' + item.nextJellyfinEpisode?.IndexNumber) ||
								item.sonarrSeries?.genres?.join(', ') ||
								'',
							progress: item.continueWatching?.progress,
							runtime: item.nextJellyfinEpisode?.RunTimeTicks
								? item.nextJellyfinEpisode?.RunTimeTicks / 10_000_000 / 60
								: item.sonarrSeries?.runtime || 0
					  }
			)
		);

	continueWatchingProps.then((props) => {
		if (props.length === 0) {
			continueWatchingVisible = false;
		}
	});

	let showcaseIndex = 0;

	async function onNext() {
		showcaseIndex = (showcaseIndex + 1) % (await tmdbPopularMoviesPromise).length;
	}

	async function onPrevious() {
		showcaseIndex =
			(showcaseIndex - 1 + (await tmdbPopularMoviesPromise).length) %
			(await tmdbPopularMoviesPromise).length;
	}
</script>

<div class="h-[80vh] sm:h-screen">
	{#await tmdbPopularMoviesPromise then movies}
		{@const movie = movies[showcaseIndex]}
		{#key movie?.id}
			<TitleShowcase
				tmdbId={movie?.id || 0}
				type="movie"
				title={movie?.title || ''}
				genres={movie?.genres?.map((g) => g.name || '') || []}
				runtime={movie?.runtime || 0}
				releaseDate={new Date(movie?.release_date || Date.now())}
				tmdbRating={movie?.vote_average || 0}
				trailerId={movie?.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
					?.key}
				director={movie?.credits?.crew?.find((c) => c.job === 'Director')?.name}
				backdropUri={movie?.backdrop_path || ''}
				posterUri={movie?.poster_path || ''}
				{onPrevious}
				{onNext}
				{showcaseIndex}
				showcaseLength={movies.length}
			/>
		{/key}
	{/await}
</div>

<div class="py-8" hidden={!continueWatchingVisible}>
	<Carousel gradientFromColor="from-stone-950" class="px-4 lg:px-16 2xl:px-32">
		<div slot="title" class="text-xl font-medium text-zinc-200">Continue Watching</div>
		{#await continueWatchingProps}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop}
				<Poster {...prop}>
					<div slot="bottom-left" class="text-sm font-medium text-zinc-300">
						{#if prop.progress}
							{(prop.runtime - (prop.runtime / 100) * prop.progress).toFixed()} Minutes Left
						{/if}
					</div>
				</Poster>
			{/each}
		{/await}
	</Carousel>
</div>
