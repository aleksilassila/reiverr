<script lang="ts">
	import {
		getJellyfinBackdrop,
		getJellyfinContinueWatching,
		getJellyfinNextUp
	} from '$lib/apis/jellyfin/jellyfinApi';
	import { getTmdbMovie, getTmdbPopularMovies } from '$lib/apis/tmdb/tmdbApi';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import classNames from 'classnames';
	import Carousel from '../Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../Carousel/CarouselPlaceholderItems.svelte';
	import EpisodeCard from '../EpisodeCard/EpisodeCard.svelte';
	import TitleShowcase from './TitleShowcaseBackground.svelte';
	import TitleShowcaseVisuals from './TitleShowcaseVisuals.svelte';
	import PageDots from '../PageDots.svelte';
	import IconButton from '../IconButton.svelte';
	import { ChevronRight } from 'radix-icons-svelte';

	let hideUI = false;

	let continueWatchingEmpty = false;

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
						// runtime: item.RunTimeTicks ? item.RunTimeTicks / 10_000_000 / 60 : 0,
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
			continueWatchingEmpty = true;
		}
	});

	let popularMovies: (
		| {
				movie: Awaited<ReturnType<typeof getTmdbPopularMovies>>[0];
				lazyRuntime: Promise<number>;
				lazyTrailerId: Promise<string | undefined>;
		  }
	)[] = [];

	/**
	 * Here we load a list of popular movies:
	 *   * runtime & video data is not available as part of the initial request
	 *   * If an additional detail request fails, we unload the movie from the showcase
	 */
	const tmdbPopularMoviesPromise = getTmdbPopularMovies().then(
		(movies) =>
			(popularMovies = movies.map((movie) => {
				const movieDetails = getTmdbMovie(movie.id || 0);
				const movieDetailsPromise = movieDetails.then((fullMovie) => ({
					runtime: fullMovie?.runtime || 0,
					trailerId: fullMovie?.videos?.results?.find(
						(v) => v.site === 'YouTube' && v.type === 'Trailer'
					)?.key
				}));

				movieDetails.catch(() => unloadMovie());
				movieDetails.then((md) => !md && unloadMovie());
				const unloadMovie = () => {
					const idx = popularMovies.findIndex((m) => m.movie === movie);
					popularMovies.splice(idx, 1);
					popularMovies = popularMovies;
				};

				return {
					movie,
					lazyRuntime: movieDetailsPromise.then((fm) => fm.runtime),
					lazyTrailerId: movieDetailsPromise.then((fm) => fm.trailerId)
				};
			}))
	);

	let showcaseIndex = 0;
	$: clampedPopularMovies = popularMovies.slice(0, 10);
	$: visibleShowcaseMovie = clampedPopularMovies[showcaseIndex];

	async function onNext() {
		showcaseIndex = (showcaseIndex + 1) % (await tmdbPopularMoviesPromise).length;
	}

	async function onPrevious() {
		showcaseIndex =
			(showcaseIndex - 1 + (await tmdbPopularMoviesPromise).length) %
			(await tmdbPopularMoviesPromise).length;
	}

	async function onJump(index: number) {
		showcaseIndex = index;
		console.log(showcaseIndex);
	}

	// Cycle movies every 5 seconds
	// onMount(() => {
	// 	const interval = setInterval(() => {
	// 		onNext();
	// 	}, 2000);

	// 	return () => clearInterval(interval);
	// });

	const PADDING = 'px-4 lg:px-8 2xl:px-16';
</script>

<div class="h-screen flex flex-col relative pb-6 gap-6 xl:gap-8 overflow-hidden">
	<div
		class={classNames(
			'flex-1 grid grid-cols-[1fr_max-content] grid-rows-[1fr_max-content] items-end gap-6',
			PADDING
		)}
	>
		{#if visibleShowcaseMovie}
			{@const { movie, lazyRuntime, lazyTrailerId } = visibleShowcaseMovie}

			{#key movie?.id}
				<TitleShowcaseVisuals
					tmdbId={movie?.id || 0}
					type="movie"
					title={movie?.title || ''}
					genreIds={movie.genre_ids || []}
					{lazyRuntime}
					releaseDate={new Date(movie?.release_date || Date.now())}
					tmdbRating={movie?.vote_average || 0}
					posterUri={movie?.poster_path || ''}
					{hideUI}
				/>
			{/key}
			<div
				class="md:relative self-stretch flex justify-center items-end row-start-2 row-span-1 col-start-1 col-span-2 md:row-start-1 md:row-span-2 md:col-start-2 md:col-span-2"
			>
				<PageDots
					index={showcaseIndex}
					length={clampedPopularMovies.length}
					{onJump}
					{onPrevious}
					{onNext}
				/>
				{#if !hideUI}
					<div class="absolute top-1/2 right-0 z-10">
						<IconButton on:click={onNext}>
							<ChevronRight size={38} />
						</IconButton>
					</div>
				{/if}
			</div>

			{#key movie?.id}
				<TitleShowcase
					tmdbId={movie?.id || 0}
					{lazyTrailerId}
					backdropUri={movie?.backdrop_path || ''}
				/>
			{/key}
		{/if}
	</div>
	<div
		class={classNames('z-[1] transition-opacity', {
			'opacity-0': hideUI
		})}
	>
		{#if !continueWatchingEmpty}
			<Carousel gradientFromColor="from-transparent" scrollClass={PADDING}>
				<div slot="title" class="text-lg font-semibold text-zinc-300">Continue Watching</div>
				{#await nextUpProps}
					<CarouselPlaceholderItems />
				{:then props}
					{#each props as prop}
						<EpisodeCard
							on:click={() => (window.location.href = `/${prop.type}/${prop.tmdbId}`)}
							{...prop}
							size="sm"
						/>
					{/each}
				{/await}
			</Carousel>
		{/if}
	</div>
</div>
