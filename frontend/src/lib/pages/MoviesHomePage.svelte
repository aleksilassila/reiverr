<script lang="ts">
	import CollectionCard from '$lib/components/Collection/CollectionCard.svelte';
	import { collectionsList, companiesList } from '$lib/components/Collection/collections';
	import CompanyCard from '$lib/components/Collection/CompanyCard.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import TmdbMoviesHeroShowcase from '$lib/components/HeroShowcase/TmdbMoviesHeroShowcase.svelte';
	import { catalogQueries } from '$lib/queries/catalog.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { queryClient } from '$lib/queries/query-client';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { scrollIntoView } from '$lib/selectable';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { TMDB_MOVIE_GENRES } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';

	backgroundContext.createContext();

	const continueWatching = usePageQuery(catalogQueries.continueWatching('movie'));

	const { registrar: registerScroll } = setScrollContext();
	const { visibleStyle } = setUiVisibilityContext();

	const trendingQuery = usePageQuery(tmdbQueries.trending('movie'));
	const digitalReleasesQuery = usePageQuery(tmdbQueries.digitalReleases());
	const upcomingQuery = usePageQuery(tmdbQueries.upcomingMovies());
	const recommendedQuery = usePageQuery(tmdbQueries.recommendedMovies());
	$: digitalReleases = $digitalReleasesQuery.data;
	$: upcomingMovies = $upcomingQuery.data;
	// Trending without what the upcoming row shows
	$: trending =
		$trendingQuery.data && digitalReleases && upcomingMovies
			? $trendingQuery.data.filter((p) => !upcomingMovies?.find((u) => u.id === p.id))
			: undefined;
	$: genreIdToMovie = $recommendedQuery.data?.genreIdToMovie ?? {};
	// The genres with the most recommendations first
	$: genres = Object.keys(genreIdToMovie)
		.map((k) => Number(k))
		.sort((a, b) => (genreIdToMovie[b]?.length || 0) - (genreIdToMovie[a]?.length || 0));

	// The account's top recommendations, else the upcoming movies
	const showcase = queryClient
		.fetchQuery(tmdbQueries.recommendedMovies())
		.then(({ top10 }) =>
			top10.length
				? top10
				: queryClient.fetchQuery(tmdbQueries.upcomingMovies()).then((m) => m.slice(0, 10))
		);

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
</script>

<div class="flex flex-col relative">
	<div use:registerScroll />
	<Container class="h-[calc(100vh-12rem)] flex px-32" on:enter={scrollIntoView({ top: 0 })}>
		<TmdbMoviesHeroShowcase movies={showcase} />
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
				<span slot="header">Trending</span>
				{#each trending as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = genres[0] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if digitalReleases}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">New Digital Releases</span>
				{#each digitalReleases as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = genres[1] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if upcomingMovies}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Upcoming Movies</span>
				{#each upcomingMovies as item}
					<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = genres[2] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = genres[3] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		<!-- {#await travisBellCollections then travisBellCollections}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
				<span slot="header">Collections</span>
				{#each travisBellCollections as collection}
					<CollectionCard on:enter={scrollIntoView({ left: 128 })} {collection} />
				{/each}
			</Carousel>
		{/await} -->

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
			<span slot="header">Collections</span>
			{#each collectionsList as collection}
				<CollectionCard on:enter={scrollIntoView({ left: 128 })} {collection} />
			{/each}
		</Carousel>

		{#if $recommendedQuery.data}
			{@const genre = genres[4] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		{#if $recommendedQuery.data}
			{@const genre = genres[5] || -1}
			{@const items = genreIdToMovie[genre] || []}
			{#if items.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
					<span slot="header">{TMDB_MOVIE_GENRES.find((g) => g.id == genre)?.name}</span>
					{#each items as item}
						<TmdbCard on:enter={scrollIntoView({ left: 128 })} size="lg" {item} />
					{/each}
				</Carousel>
			{/if}
		{/if}

		<Carousel scrollClass="px-32" on:enter={scrollIntoView({ top: 128 })}>
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
