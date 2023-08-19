<script lang="ts">
	import { TmdbApiOpen, type TmdbMovie2, type TmdbSeries2 } from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import GenreCard from '$lib/components/GenreCard.svelte';
	import NetworkCard from '$lib/components/NetworkCard.svelte';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import { genres, networks } from '$lib/discover';
	import { library } from '$lib/stores/library.store';
	import { settings } from '$lib/stores/settings.store';
	import { formatDateToYearMonthDay } from '$lib/utils';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';

	function parseIncludedLanguages(includedLanguages: string) {
		return includedLanguages.replace(' ', '').split(',').join('|');
	}

	const fetchCardProps = async (items: TmdbMovie2[] | TmdbSeries2[]) =>
		Promise.all(
			(
				await ($settings.discover.excludeLibraryItems
					? library.filterNotInLibrary(items, (t) => t.id || 0)
					: items)
			).map(fetchCardTmdbProps)
		).then((props) => props.filter((p) => p.backdropUrl));

	const fetchTrendingProps = () =>
		TmdbApiOpen.get('/3/trending/all/{time_window}', {
			params: {
				path: {
					time_window: 'day'
				},
				query: {
					language: $settings.language
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchTrendingActorProps = () =>
		TmdbApiOpen.get('/3/trending/person/{time_window}', {
			params: {
				path: {
					time_window: 'week'
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((actors) =>
				actors
					.filter((a) => a.profile_path)
					.map((actor) => ({
						tmdbId: actor.id || 0,
						backdropUri: actor.profile_path || '',
						name: actor.name || '',
						subtitle: actor.known_for_department || ''
					}))
			);

	const fetchUpcomingMovies = () =>
		TmdbApiOpen.get('/3/discover/movie', {
			params: {
				query: {
					'primary_release_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					region: $settings.discover.region,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchUpcomingSeries = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'first_air_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchDigitalReleases = () =>
		TmdbApiOpen.get('/3/discover/movie', {
			params: {
				query: {
					with_release_type: 4,
					sort_by: 'popularity.desc',
					'release_date.lte': formatDateToYearMonthDay(new Date()),
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
					// region: $settings.discover.region
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchNowStreaming = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'air_date.gte': formatDateToYearMonthDay(new Date()),
					'first_air_date.lte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);
</script>

<div
	class="pt-24 bg-stone-950 pb-8"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<div class="max-w-screen-2xl mx-auto">
		<Carousel
			gradientFromColor="from-stone-950"
			heading={$_('discover.trending')}
			class="mx-2 sm:mx-8 2xl:mx-0"
		>
			{#await fetchTrendingProps()}
				<CarouselPlaceholderItems size="lg" />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card size="lg" {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
</div>

<div
	class="flex flex-col gap-8 max-w-screen-2xl mx-auto py-4"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.popularPeople')}>
		{#await fetchTrendingActorProps()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<PeopleCard {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.upcomingMovies')}>
		{#await fetchUpcomingMovies()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Card {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.upcomingSeries')}>
		{#await fetchUpcomingSeries()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Card {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.genres')}>
		{#each Object.values(genres) as genre (genre.tmdbGenreId)}
			<GenreCard {genre} />
		{/each}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.newDigitalReleases')}>
		{#await fetchDigitalReleases()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Card {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.streamingNow')}>
		{#await fetchNowStreaming()}
			<CarouselPlaceholderItems />
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Card {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel class="mx-2 sm:mx-8 2xl:mx-0" heading={$_('discover.TVNetworks')}>
		{#each Object.values(networks) as network (network.tmdbNetworkId)}
			<NetworkCard {network} />
		{/each}
	</Carousel>
</div>
