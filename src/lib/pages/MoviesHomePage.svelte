<script lang="ts">
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { derived } from 'svelte/store';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { TMDB_MOVIE_GENRES, TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { getShowcasePropsFromTmdbMovie } from '../components/HeroShowcase/HeroShowcase';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { navigate } from '../components/StackRouter/StackRouter';
	import { scrollIntoView } from '../selectable';
	import { formatDateToYearMonthDay } from '../utils';

	const { ...libraryData } = libraryItemsDataStore.getRequest();
	const libraryContinueWatching = derived(libraryData, (libraryData) => {
		if (!libraryData) return [];

		const movies = libraryData.filter((i) => i.mediaType === 'Movie' && i.playStates?.length);

		movies.sort((a, b) => {
			const aMax = Math.max(
				...(a.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);
			const bMax = Math.max(
				...(b.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);

			return bMax - aMax;
		});

		return movies.map((i) => i.metadata);
	});

	// const continueWatching = jellyfinApi.getContinueWatching('movie');
	// const recentlyAdded = jellyfinApi.getRecentlyAdded('movie');

	const popularMovies = tmdbApi.getPopularMovies();

	const newDigitalReleases = getDigitalReleases();
	const upcomingMovies = getUpcomingMovies();
	const recommendedMovies = tmdbApi.getRecommendedMovies();
	const mostRecommendedGenres: Promise<number[]> = recommendedMovies.then(({ genreIdToMovie }) => {
		const allGenres = Object.keys(genreIdToMovie);
		allGenres.sort((a, b) => (genreIdToMovie[b]?.length || 0) - (genreIdToMovie[a].length || 0));
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
</script>

<DetachedPage class="flex flex-col relative">
	<div class="h-[calc(100vh-12rem)] flex px-32">
		<HeroShowcase
			items={recommendedMovies.then(({ top10 }) => getShowcasePropsFromTmdbMovie(top10))}
			on:enter={scrollIntoView({ top: 0 })}
			on:select={({ detail }) => navigate(`/movie/${detail?.id}`)}
		/>
	</div>
	<div class="my-16 space-y-8 relative z-10">
		{#if $libraryContinueWatching.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Continue Watching</span>
				{#each $libraryContinueWatching as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		<!-- {#await continueWatching then continueWatching}
			{#if continueWatching?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">Continue Watching</span>
					{#each continueWatching as item (item.Id)}
						<JellyfinCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{:else}
				{#await recentlyAdded then recentlyAdded}
					{#if recentlyAdded?.length}
						<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
							<span slot="header">Recently Added</span>
							{#each recentlyAdded as item (item.Id)}
								<JellyfinCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
							{/each}
						</Carousel>
					{/if}
				{/await}
			{/if}
		{/await} -->

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
