<script lang="ts">
	import {
		getJellyfinBackdrop,
		getJellyfinContinueWatching,
		getJellyfinNextUp
	} from '$lib/apis/jellyfin/jellyfinApi';
	import { getTmdbMovie, getTmdbPopularMovies } from '$lib/apis/tmdb/tmdbApi';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import EpisodeCard from '$lib/components/EpisodeCard/EpisodeCard.svelte';
	import TitleShowcase from '$lib/components/TitleShowcase/TitleShowcase.svelte';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import { log } from '$lib/utils';

	let continueWatchingVisible = true;

	const tmdbPopularMoviesPromise = getTmdbPopularMovies()
		.then((movies) => Promise.all(movies.map((movie) => getTmdbMovie(movie.id || 0))))
		.then((movies) => movies.filter((m) => !!m).slice(0, 10));

	let nextUpP = getJellyfinNextUp();
	let continueWatchingP = getJellyfinContinueWatching();

	let nextUpProps = Promise.all([nextUpP, continueWatchingP])
		.then(([nextUp, continueWatching]) => [
			...(continueWatching || []),
			...(nextUp?.filter((i) => !continueWatching?.find((c) => c.SeriesId === i.SeriesId)) || [])
		])
		.then((items) =>
			Promise.all(
				items?.map(async (item) => {
					const parentSeries = await jellyfinItemsStore.promise.then((items) =>
						items.find((i) => i.Id === item.SeriesId)
					);

					return {
						tmdbId: Number(item.ProviderIds?.Tmdb) || Number(parentSeries?.ProviderIds?.Tmdb) || 0,
						jellyfinId: item.Id,
						backdropUrl: getJellyfinBackdrop(item),
						title: item.Name || '',
						progress: item.UserData?.PlayedPercentage || undefined,
						runtime: item.RunTimeTicks ? item.RunTimeTicks / 10_000_000 / 60 : 0,
						...(item.Type === 'Movie'
							? {
									type: 'movie',
									subtitle: item.Genres?.join(', ') || ''
							  }
							: {
									type: 'series',
									subtitle:
										(item?.IndexNumber && 'Episode ' + item.IndexNumber) ||
										item.Genres?.join(', ') ||
										''
							  })
					} as const;
				})
			)
		);

	nextUpProps.then((props) => {
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
		{#await nextUpProps}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop}
				<EpisodeCard
					on:click={() => (window.location.href = `/${prop.type}/${prop.tmdbId}`)}
					{...prop}
				/>
			{/each}
		{/await}
	</Carousel>
</div>
