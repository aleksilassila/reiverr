<script lang="ts">
	import {
		TmdbApiOpen,
		getTmdbDigitalReleases,
		getTmdbTrendingAll,
		getTmdbUpcomingMovies,
		getTrendingActors,
		type TmdbMovie2,
		type TmdbSeries2
	} from '$lib/apis/tmdb/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import GenreCard from '$lib/components/GenreCard.svelte';
	import NetworkCard from '$lib/components/NetworkCard.svelte';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import { genres, networks } from '$lib/discover';
	import { library } from '$lib/stores/library.store';
	import { getIncludedLanguagesQuery, settings } from '$lib/stores/settings.store';
	import { formatDateToYearMonthDay } from '$lib/utils';

	const fetchCardProps = async (items: TmdbMovie2[] | TmdbSeries2[]) =>
		Promise.all(
			(
				await ($settings.excludeLibraryItemsFromDiscovery
					? library.filterNotInLibrary(items, (t) => t.id)
					: items)
			).map(fetchCardTmdbProps)
		).then((props) => props.filter((p) => p.backdropUri));

	const fetchTrendingProps = () => getTmdbTrendingAll().then(fetchCardProps);
	const fetchDigitalReleases = () => getTmdbDigitalReleases().then(fetchCardProps);
	const fetchNowStreaming = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'air_date.gte': formatDateToYearMonthDay(new Date()),
					'first_air_date.lte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					...getIncludedLanguagesQuery()
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);
	const fetchUpcomingMovies = () => getTmdbUpcomingMovies().then(fetchCardProps);
	const fetchUpcomingSeries = () =>
		TmdbApiOpen.get('/3/discover/tv', {
			params: {
				query: {
					'first_air_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					...getIncludedLanguagesQuery()
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchTrendingActorProps = () =>
		getTrendingActors().then((actors) =>
			actors
				.filter((a) => a.profile_path)
				.map((actor) => ({
					tmdbId: actor.id || 0,
					backdropUri: actor.profile_path || '',
					name: actor.name || '',
					subtitle: actor.known_for_department || ''
				}))
		);

	const headerStyle = 'uppercase tracking-widest font-bold';
</script>

<div class="pb-24 flex flex-col gap-4">
	<div class="pt-24 bg-black">
		<Carousel gradientFromColor="from-black">
			<div slot="title" class={headerStyle}>Trending</div>
			{#await fetchTrendingProps()}
				<CarouselPlaceholderItems size="lg" />
			{:then props}
				{#each props as prop}
					<Card size="lg" {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Popular People</div>
			{#await fetchTrendingActorProps()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<PeopleCard {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Upcoming Movies</div>
			{#await fetchUpcomingMovies()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Upcoming Series</div>
			{#await fetchUpcomingSeries()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Genres</div>
			{#each Object.values(genres) as genre}
				<GenreCard {genre} />
			{/each}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>New Digital Releeases</div>
			{#await fetchDigitalReleases()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Streaming Now</div>
			{#await fetchNowStreaming()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>TV Networks</div>
			{#each Object.values(networks) as network}
				<NetworkCard {network} />
			{/each}
		</Carousel>
	</div>
</div>
