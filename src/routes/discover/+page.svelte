<script lang="ts">
	import { requestTmdbPopularMovies } from '$lib/tmdb-api';
	import Card from '../components/Card/Card.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import NetflixCard from './NetflixCard.svelte';
	import HboCard from './HboCard.svelte';
	import DisneyCard from './DisneyCard.svelte';
	import AmazonCard from './AmazonCard.svelte';
	import AppleCard from './AppleCard.svelte';
	import HuluCard from './HuluCard.svelte';

	const headerStyle = 'uppercase tracking-widest font-bold';

	const { data: popularMovies } = requestTmdbPopularMovies();
</script>

<div class="pb-24 flex flex-col gap-4">
	<!--	Does not contain any of the titles in library.-->
	<div class="pt-24 bg-stone-800">
		<Carousel>
			<div slot="title" class={headerStyle}>For You</div>
			{#each $popularMovies ? [...$popularMovies].reverse() : [] as movie (movie.id)}
				<Card tmdbId={movie.id} />
			{:else}
				<CarouselPlaceholderItems />
			{/each}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Popular Movies</div>
			{#each $popularMovies || [] as movie (movie.id)}
				<Card tmdbId={movie.id} />
			{:else}
				<CarouselPlaceholderItems />
			{/each}
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
