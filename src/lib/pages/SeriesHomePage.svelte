<script lang="ts">
	import Container from '../../Container.svelte';
	import { TmdbApi, tmdbApi } from '../apis/tmdb/tmdb-api';

	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { useRequest } from '../stores/data.store';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { getShowcasePropsFromTmdbSeries } from '../components/HeroShowcase/HeroShowcase';
	import { scrollIntoView } from '../selectable';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { Route } from 'svelte-navigator';
	import SeriesPage from '../components/SeriesPage/SeriesPage.svelte';
	import { formatDateToYearMonthDay } from '../utils';
	import TmdbCard from '../components/Card/TmdbCard.svelte';

	const continueWatching = jellyfinApi.getContinueWatchingSeries();
	const recentlyAdded = jellyfinApi.getRecentlyAdded('series');

	const nowStreaming = getNowStreaming();
	const upcomingSeries = fetchUpcomingSeries();

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

<Container focusOnMount class="flex flex-col">
	<div class="h-[calc(100vh-12rem)] flex px-32">
		<HeroShowcase
			items={tmdbApi.getPopularSeries().then(getShowcasePropsFromTmdbSeries)}
			on:enter={scrollIntoView({ top: 0 })}
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

		{#await nowStreaming then nowStreaming}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Now Streaming</span>
				{#each nowStreaming as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}

		{#await upcomingSeries then upcomingSeries}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Upcoming Series</span>
				{#each upcomingSeries as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/await}
	</div>
</Container>

<Route path=":id/*" component={SeriesPage} />
