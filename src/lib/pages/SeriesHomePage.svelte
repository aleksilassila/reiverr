<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import TmdbSeriesHeroShowcase from '$lib/components/HeroShowcase/TmdbSeriesHeroShowcase.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { tmdbApi, tmdbApi4 } from '$lib/stores/user.store';
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';
	import { TMDB_SERIES_GENRES } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import { networks, networksList } from '$lib/components/Collection/collections';
	import NetworkCard from '$lib/components/Collection/NetworkCard.svelte';

	createBackgroundPage();

	const { registrar: registerScroll } = setScrollContext();
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

		return series;
	});
	$: libraryContinueWatchingKey = $libraryContinueWatching && Symbol();

	const popular = tmdbApi.getTrendingSeries();
	const nowStreaming = tmdbApi.getNowStreamingSeries();
	const upcomingSeries = tmdbApi.getUpcomingSeries();
	const recommendations = tmdbApi4.getRecommendedSeries();

	onDestroy(() => {
		libraryData.unsubscribe();
	});
</script>

<div class="flex flex-col relative">
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				{/key}
			</Carousel>
		{/if}

		{#await Promise.all( [popular, nowStreaming, upcomingSeries] ) then [popular, nowStreaming, upcomingSeries]}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Trending Today</span>
				{#each popular.filter((p) => !nowStreaming.find((n) => n.id === p.id) && !upcomingSeries.find((u) => u.id === p.id)) as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await nowStreaming then nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Streaming Now</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await upcomingSeries then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Series</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		{#await recommendations then { genreIdToMovie, topGenres }}
			{@const genre = topGenres[4]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
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
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/await}

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
			<span slot="header">Networks</span>
			{#each networksList as network}
				<NetworkCard on:enter={scrollIntoView({ left: 128 })} {network} />
			{/each}
		</Carousel>

		<!-- GENRES -->
		<!-- TOP RATED -->
		<!-- TRENDING PEOPLE -->
		<!-- Watchlist -->
	</div>
</div>
