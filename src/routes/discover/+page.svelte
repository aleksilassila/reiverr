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
	import { fade, fly } from 'svelte/transition';

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

<div
	class="flex flex-col gap-4"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<div class="pt-24 bg-black">
		<Carousel gradientFromColor="from-black" heading="Trending">
			{#await fetchTrendingProps()}
				<CarouselPlaceholderItems size="lg" />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card size="lg" {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="Popular People">
			{#await fetchTrendingActorProps()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<PeopleCard {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="Upcoming Movies">
			{#await fetchUpcomingMovies()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="Upcoming Series">
			{#await fetchUpcomingSeries()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="Genres">
			{#each Object.values(genres) as genre (genre.tmdbGenreId)}
				<GenreCard {genre} />
			{/each}
		</Carousel>
	</div>
	<div>
		<Carousel heading="New Digital Releeases">
			{#await fetchDigitalReleases()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="Streaming Now">
			{#await fetchNowStreaming()}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop (prop.tmdbId)}
					<Card {...prop} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel heading="TV Networks">
			{#each Object.values(networks) as network (network.tmdbNetworkId)}
				<NetworkCard {network} />
			{/each}
		</Carousel>
	</div>
</div>
