<script lang="ts">
	import { TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';

	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { getShowcasePropsFromTmdbSeries } from '../components/HeroShowcase/HeroShowcase';
	import { scrollIntoView } from '../selectable';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { formatDateToYearMonthDay } from '../utils';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import { navigate } from '../components/StackRouter/StackRouter';
	import { TMDB_SERIES_GENRES } from '../apis/tmdb/tmdb-api.js';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';

	const continueWatching = jellyfinApi.getContinueWatchingSeries();
	const recentlyAdded = jellyfinApi.getRecentlyAdded('series');

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
</script>

<DetachedPage class="flex flex-col relative">
	<div class="h-[calc(100vh-12rem)] flex px-32">
		<HeroShowcase
			items={recommendations.then(({ top10 }) => getShowcasePropsFromTmdbSeries(top10))}
			on:enter={scrollIntoView({ top: 0 })}
			on:select={({ detail }) => navigate(`/series/${detail?.id}`)}
		/>
	</div>
	<div class="my-16 space-y-8">
		{#await continueWatching then continueWatching}
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
		{/await}

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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => g.id == genre)?.name}</span>
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
