<script lang="ts">
	import { fetchTmdbPopularMovies, requestTmdbPopularMovies } from '$lib/tmdb-api';
	import Card from '../components/Card/Card.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import NetflixCard from './NetflixCard.svelte';
	import HboCard from './HboCard.svelte';
	import DisneyCard from './DisneyCard.svelte';
	import AmazonCard from './AmazonCard.svelte';
	import AppleCard from './AppleCard.svelte';
	import HuluCard from './HuluCard.svelte';
	import { onMount } from 'svelte';

	const headerStyle = 'uppercase tracking-widest font-bold';

	let popularMovies;

	onMount(() => {
		popularMovies = fetchTmdbPopularMovies();
	});
</script>

<div class="pb-24 flex flex-col gap-4">
	<!--	Does not contain any of the titles in library.-->
	<div class="pt-24 bg-black">
		<Carousel>
			<div slot="title" class={headerStyle}>For You</div>
			{#await popularMovies}
				<CarouselPlaceholderItems large={true} />
			{:then movies}
				{#each movies ? [...movies].reverse() : [] as movie (movie.id)}
					<Card large={true} tmdbId={movie.id} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Popular Movies</div>
			{#await popularMovies}
				<CarouselPlaceholderItems />
			{:then movies}
				{#each movies || [] as movie (movie.id)}
					<Card tmdbId={movie.id} />
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
