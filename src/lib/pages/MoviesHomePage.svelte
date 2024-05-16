<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';
	import { getShowcasePropsFromTmdbMovie } from '../components/HeroShowcase/HeroShowcase';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import { scrollIntoView } from '../selectable';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { useRequest } from '../stores/data.store';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import MoviePage from './MoviePage.svelte';
	import { formatDateToYearMonthDay } from '../utils';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import { navigate } from '../components/StackRouter/StackRouter';

	const continueWatching = jellyfinApi.getContinueWatching('movie');
	const recentlyAdded = jellyfinApi.getRecentlyAdded('movie');

	const popularMovies = tmdbApi.getPopularMovies();

	const newDigitalReleases = getDigitalReleases();
	const upcomingMovies = getUpcomingMovies();
	const recommendedMovies = tmdbApi.getRecommendedMovies();
	recommendedMovies.then((res) => console.log('Recommended Movies', res));

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

<Container focusOnMount class="flex flex-col">
	<div class="h-[calc(100vh-12rem)] flex px-32">
		<HeroShowcase
			items={popularMovies.then(getShowcasePropsFromTmdbMovie)}
			on:enter={scrollIntoView({ top: 0 })}
			on:select={({ detail }) => {
				navigate(`/movie/${detail?.id}`);
			}}
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

		{#await recommendedMovies then recommendedMovies}
			{#if recommendedMovies?.length}
				<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
					<span slot="header">Recommended Movies</span>
					{#each recommendedMovies as item}
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

		{#await upcomingMovies then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Movies</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}
	</div>
</Container>
