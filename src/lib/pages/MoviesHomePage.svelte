<script lang="ts">
	import CollectionCard from '$lib/components/Collection/CollectionCard.svelte';
	import {
		collectionsList,
		companiesList,
		type Collection
	} from '$lib/components/Collection/collections';
	import CompanyCard from '$lib/components/Collection/CompanyCard.svelte';
	import Container from '$lib/components/Container.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import TmdbMoviesHeroShowcase from '$lib/components/HeroShowcase/TmdbMoviesHeroShowcase.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { tmdbApi, tmdbApi4 } from '$lib/stores/user.store';
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';
	import { TMDB_MOVIE_GENRES } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';

	createBackgroundPage();

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

	const popularMovies = tmdbApi.getTrendingMovies();
	const newDigitalReleases = tmdbApi.getDigitalMovieReleases();
	const upcomingMovies = tmdbApi.getUpcomingMovies();
	const recommendedMovies = tmdbApi4.getRecommendedMovies();
	const mostRecommendedGenres: Promise<number[]> = recommendedMovies.then(({ genreIdToMovie }) => {
		const allGenres = Object.keys(genreIdToMovie).map((k) => Number(k));
		allGenres.sort((a, b) => (genreIdToMovie[b]?.length || 0) - (genreIdToMovie[a]?.length || 0));
		return allGenres;
	});

	// const travisBellCollections: Promise<Collection[]> = tmdbApi.v3
	// 	.accountLists('travisbell')
	// 	.then((lists) => {
	// 		return (
	// 			lists.data.results?.map((l) => ({
	// 				id: Number(l.id),
	// 				name: String(l.name),
	// 				route: String(l.id),
	// 				backdropUrl: l.poster_path ? `${TMDB_BACKDROP_SMALL}${l.poster_path}` : undefined
	// 			})) || []
	// 		);
	// 	});

	onDestroy(() => {
		libraryData.unsubscribe();
	});
</script>

<div class="flex flex-col relative">
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				{/key}
			</Carousel>
		{/if}

		{#await Promise.all( [popularMovies, newDigitalReleases, upcomingMovies] ) then [popularMovies, newDigitalReleases, upcomingMovies]}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Trending</span>
				{#each popularMovies.filter((p) => !upcomingMovies.find((u) => u.id === p.id)) as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await newDigitalReleases then nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">New Digital Releases</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await upcomingMovies then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Movies</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<!-- {#await travisBellCollections then travisBellCollections}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Collections</span>
				{#each travisBellCollections as collection}
					<CollectionCard on:enter={scrollIntoView({ left: 128 })} {collection} />
				{/each}
			</Carousel>
		{/await} -->

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
			<span slot="header">Collections</span>
			{#each collectionsList as collection}
				<CollectionCard on:enter={scrollIntoView({ left: 128 })} {collection} />
			{/each}
		</Carousel>

		{#await Promise.all( [mostRecommendedGenres, recommendedMovies] ) then [genres, { genreIdToMovie }]}
			{@const genre = genres[4] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
			<span slot="header">Production Companies</span>
			{#each companiesList as company}
				<CompanyCard on:enter={scrollIntoView({ left: 128 })} {company} />
			{/each}
		</Carousel>

		<!-- GENRES -->
		<!-- TOP RATED -->
		<!-- TRENDING PEOPLE -->
		<!-- Watchlist -->
	</div>
</div>
