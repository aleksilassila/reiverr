<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import TmdbMoviesHeroShowcase from '$lib/components/HeroShowcase/TmdbMoviesHeroShowcase.svelte';
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';
	import { TMDB_MOVIE_GENRES, TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { scrollIntoView } from '../selectable';
	import { formatDateToYearMonthDay } from '../utils';

	const { registerScroll } = setScrollContext();
	const { visibleStyle } = setUiVisibilityContext();

	const { ...libraryData } = libraryItemsDataStore.subscribe();
	const libraryContinueWatching = derived(libraryData, (libraryData) => {
		if (!libraryData) return [];

		const movies = libraryData.filter(
			(i) => i.mediaType === 'Movie' && i.playStates?.length && !i.watched
		);

		movies.sort((a, b) => {
			const aMax = Math.max(
				...(a.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);
			const bMax = Math.max(
				...(b.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);

			return bMax - aMax;
		});

		return movies;
	});
	$: libraryContinueWatchingKey = $libraryContinueWatching && Symbol();

	const popularMovies = tmdbApi.getPopularMovies();

	const newDigitalReleases = getDigitalReleases();
	const upcomingMovies = getUpcomingMovies();
	const recommendedMovies = tmdbApi.getRecommendedMovies();
	const mostRecommendedGenres: Promise<number[]> = recommendedMovies.then(({ genreIdToMovie }) => {
		const allGenres = Object.keys(genreIdToMovie).map((k) => Number(k));
		allGenres.sort((a, b) => (genreIdToMovie[b]?.length || 0) - (genreIdToMovie[a]?.length || 0));
		return allGenres;
	});

	function getUpcomingMovies() {
		return TmdbApi.getClient()
			.GET('/3/discover/movie', {
				params: {
					query: {
						'primary_release_date.gte': formatDateToYearMonthDay(new Date()),
						sort_by: 'popularity.desc'
						// language: $settings.language,
						// region: $settings.discover.region,
						// with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
					}
				}
			})
			.then((res) => res.data?.results || []);
	}

	function getDigitalReleases() {
		return TmdbApi.getClient()
			.GET('/3/discover/movie', {
				params: {
					query: {
						with_release_type: 4,
						sort_by: 'popularity.desc',
						'release_date.lte': formatDateToYearMonthDay(new Date())
						// language: $settings.language,
						// with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
						// region: $settings.discover.region
					}
				}
			})
			.then((res) => res.data?.results || []);
	}

	onDestroy(() => {
		libraryData.unsubscribe();
	});
</script>

<DetachedPage class="flex flex-col relative">
	<div use:registerScroll />
	<Container class="h-[calc(100vh-12rem)] flex px-32" on:enter={scrollIntoView({ top: 0 })}>
		<TmdbMoviesHeroShowcase
			movies={recommendedMovies.then(({ top10 }) =>
				top10.length ? top10 : upcomingMovies.then((m) => m.slice(0, 10))
			)}
		/>
	</Container>
	<div class="my-16 space-y-8 relative z-10" style={$visibleStyle}>
		{#if $libraryContinueWatching.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Continue Watching</span>
				{#key libraryContinueWatchingKey}
					{#each $libraryContinueWatching as item (item.id)}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				{/key}
			</Carousel>
		{/if}

		{#await popularMovies then popularMovies}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Popular</span>
				{#each popularMovies as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[0] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await newDigitalReleases then nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">New Digital Releases</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[1] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await upcomingMovies then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Movies</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[2] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[3] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<!-- NETWORKS -->

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[4] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[5] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<!-- GENRES -->
		<!-- TOP RATED -->
		<!-- TRENDING PEOPLE -->
		<!-- Watchlist -->
	</div>
</DetachedPage>
