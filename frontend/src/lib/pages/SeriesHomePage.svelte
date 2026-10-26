<script lang="ts">
	import { networksList } from '$lib/components/Collection/collections';
	import NetworkCard from '$lib/components/Collection/NetworkCard.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import TmdbSeriesHeroShowcase from '$lib/components/HeroShowcase/TmdbSeriesHeroShowcase.svelte';
	import { catalogQueries } from '$lib/queries/catalog.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { queryClient } from '$lib/queries/query-client';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { TMDB_SERIES_GENRES } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';

	backgroundContext.createContext();
	const continueWatching = usePageQuery(catalogQueries.continueWatching('series'));

	const { registrar: registerScroll } = setScrollContext();
	const { visibleStyle } = setUiVisibilityContext();

	const trendingQuery = usePageQuery(tmdbQueries.trending('series'));
	const nowStreamingQuery = usePageQuery(tmdbQueries.nowStreaming());
	const upcomingQuery = usePageQuery(tmdbQueries.upcomingSeries());
	const recommendedQuery = usePageQuery(tmdbQueries.recommendedSeries());
	$: nowStreaming = $nowStreamingQuery.data;
	$: upcomingSeries = $upcomingQuery.data;
	// Trending without what the rows below show
	$: trending =
		$trendingQuery.data && nowStreaming && upcomingSeries
			? $trendingQuery.data.filter(
					(p) =>
						!nowStreaming?.find((n) => n.id === p.id) && !upcomingSeries?.find((u) => u.id === p.id)
				)
			: undefined;
	$: genreIdToMovie = $recommendedQuery.data?.genreIdToMovie ?? {};
	$: topGenres = $recommendedQuery.data?.topGenres ?? [];

	// The account's top recommendations, else the upcoming series
	const showcase = queryClient
		.fetchQuery(tmdbQueries.recommendedSeries())
		.then(({ top10 }) =>
			top10.length
				? top10
				: queryClient.fetchQuery(tmdbQueries.upcomingSeries()).then((s) => s.slice(0, 10))
		);
</script>

<div class="flex flex-col relative">
	<div use:registerScroll />
	<Container class="h-[calc(100vh-12rem)] flex px-32" on:enter={scrollIntoView({ top: 0 })}>
		<TmdbSeriesHeroShowcase series={showcase} />
	</Container>
	<div class="my-16 space-y-8 relative z-10" style={$visibleStyle}>
		{#if $continueWatching.data?.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Continue Watching</span>

				{#each $continueWatching.data as item, index (item.tmdbId)}
					<TmdbCard
						{index}
						on:enter={scrollIntoView({ left: 128 })}
						size="lg"
						item={item.tmdbItem}
						progress={item.lastPlayState?.progress ?? 0}
					/>
				{/each}
			</Carousel>
		{/if}

		{#if trending}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Trending Today</span>
				{#each trending as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[0]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Streaming Now</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[1]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Upcoming Series</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[2]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[3]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[4]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = topGenres[5]}
			{@const genreItems = genreIdToMovie[genre || '']}
			{#if genreItems?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_SERIES_GENRES.find((g) => String(g.id) == genre)?.name}</span>
					{#each genreItems || [] as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
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
