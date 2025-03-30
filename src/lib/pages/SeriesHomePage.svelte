<script lang="ts">
	import { networksList } from '$lib/components/Collection/collections';
	import NetworkCard from '$lib/components/Collection/NetworkCard.svelte';
	import Container from '$lib/components/Container.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import TmdbSeriesHeroShowcase from '$lib/components/HeroShowcase/TmdbSeriesHeroShowcase.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import {
		libraryRefresher,
		useRequest
	} from '$lib/stores/data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { reiverrApi, tmdbApi, tmdbApi4, user } from '$lib/stores/user.store';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { TMDB_SERIES_GENRES } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';

	createBackgroundPage();

	const { registrar: registerScroll } = setScrollContext();
	const { visibleStyle } = setUiVisibilityContext();

	const { unsubscribe, ...continueWatching } = useRequest(
		() =>
			reiverrApi.library
				.getMyList(String(get(user)?.id), {
					type: 'series',
					order: 'last-played',
					status: 'continue-watching'
				})
				.then((r) => r.data),
		{ refresher: libraryRefresher }
	);

	$: libraryContinueWatchingKey = $continueWatching && Symbol();

	const popular = tmdbApi.getTrendingSeries();
	const nowStreaming = tmdbApi.getNowStreamingSeries();
	const upcomingSeries = tmdbApi.getUpcomingSeries();
	const recommendations = tmdbApi4.getRecommendedSeries();

	onDestroy(() => {
		unsubscribe();
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
		{#if $continueWatching?.items?.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Continue Watching</span>
				{#key libraryContinueWatchingKey}
					{#each $continueWatching?.items ?? [] as item (item.tmdbId)}
						<TmdbCard
							on:enter={scrollIntoView({ left: 128 })}
							size="lg"
							item={item.tmdbItem}
							progress={item.playStates?.[0]?.progress ?? 0}
						/>
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
