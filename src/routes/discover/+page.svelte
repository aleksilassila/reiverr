<script lang="ts">
	import { fetchTmdbMovie, fetchTmdbPopularMovies } from '$lib/apis/tmdbApi';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardPropsTmdb } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import { library } from '$lib/stores/library.store';
	import AmazonCard from './AmazonCard.svelte';
	import DisneyCard from './DisneyCard.svelte';
	import HboCard from './HboCard.svelte';
	import HuluCard from './HuluCard.svelte';
	import NetflixCard from './NetflixCard.svelte';

	async function getDiscoverData() {
		const popularMoviesPromise = fetchTmdbPopularMovies();

		const popularMovies = await popularMoviesPromise
			.then(async (movies) => {
				const libraryData = await $library;
				return movies.filter((m) => !libraryData.getItem(m.id));
			})
			.then((movies) => {
				return Promise.all(
					movies.map(async (movie) => fetchCardPropsTmdb(await fetchTmdbMovie(String(movie.id))))
				);
			});

		return {
			popularMovies
		};
	}

	const discoverPromise = getDiscoverData();

	const headerStyle = 'uppercase tracking-widest font-bold';
</script>

<div class="pb-24 flex flex-col gap-4">
	<!--	Does not contain any of the titles in library.-->

	<div class="pt-24 bg-black">
		<Carousel>
			<div slot="title" class={headerStyle}>For You</div>
			{#await discoverPromise}
				<CarouselPlaceholderItems type="large" />
			{:then { popularMovies: movies }}
				{#each movies ? [...movies].reverse() : [] as movie (movie.tmdbId)}
					<Card type="large" {...movie} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Popular Movies</div>
			{#await discoverPromise}
				<CarouselPlaceholderItems />
			{:then { popularMovies: movies }}
				{#each movies || [] as movie (movie.tmdbId)}
					<Card {...movie} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<!--	<div class={headerStyle}>Popular TV Shows</div>-->
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Networks</div>
			<NetflixCard />
			<HboCard />
			<DisneyCard />
			<AmazonCard />
			<!--			<AppleCard />-->
			<HuluCard />
		</Carousel>
	</div>
	<!--	<div class={headerStyle}>Categories</div>-->
</div>
