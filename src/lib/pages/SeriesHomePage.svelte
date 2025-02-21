<script lang="ts">
	import { TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';

	import TmdbSeriesHeroShowcase from '$lib/components/HeroShowcase/TmdbSeriesHeroShowcase.svelte';
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { derived } from 'svelte/store';
	import { TMDB_SERIES_GENRES } from '../apis/tmdb/tmdb-api.js';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { scrollIntoView } from '../selectable';
	import { formatDateToYearMonthDay } from '../utils';
	import Container from '$lib/components/Container.svelte';
	import { onDestroy } from 'svelte';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';

	const { registerScroll } = setScrollContext();
	const { visibleStyle } = setUiVisibilityContext();

	const { ...libraryData } = libraryItemsDataStore.subscribe();
	const libraryContinueWatching = derived(libraryData, (libraryData) => {
		if (!libraryData) return [];

		const series = libraryData.filter(
			(i) => i.mediaType === 'Series' && i.playStates?.length && !i.watched
		);

		series.sort((a, b) => {
			const aMax = Math.max(
				...(a.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);
			const bMax = Math.max(
				...(b.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
			);

			return bMax - aMax;
		});

		return series
	});
	$: libraryContinueWatchingKey = $libraryContinueWatching && Symbol();

	const nowStreaming = getNowStreaming();
	const upcomingSeries = fetchUpcomingSeries();
	const popular = tmdbApi.getPopularSeries();
	const recommendations = tmdbApi.getRecommendedSeries();

	function getNowStreaming() {
		return TmdbApi.getClient()
			.GET('/3/discover/tv', {
				params: {
					query: {
						'air_date.gte': formatDateToYearMonthDay(new Date()),
						'first_air_date.lte': formatDateToYearMonthDay(new Date()),
						sort_by: 'popularity.desc'
						// language: $settings.language,
						// with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
					}
				}
			})
			.then((res) => res.data?.results || []);
	}

	function fetchUpcomingSeries() {
		return TmdbApi.getClient()
			.GET('/3/discover/tv', {
				params: {
					query: {
						'first_air_date.gte': formatDateToYearMonthDay(new Date()),
						sort_by: 'popularity.desc'
						// language: $settings.language,
						// with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
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
		<TmdbSeriesHeroShowcase
			series={recommendations.then(({ top10 }) =>
				top10.length ? top10 : upcomingSeries.then((s) => s.slice(0, 10))
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

		{#await popular then popular}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Popular</span>
				{#each popular as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[0]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await nowStreaming then nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Now Streaming</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[1]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await upcomingSeries then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Series</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[2]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[3]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<!-- NETWORKS -->

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[4]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[5]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
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
