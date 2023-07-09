<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import NetflixCard from './NetflixCard.svelte';
	import HboCard from './HboCard.svelte';
	import DisneyCard from './DisneyCard.svelte';
	import AmazonCard from './AmazonCard.svelte';
	import HuluCard from './HuluCard.svelte';
	import type { PageData } from './$types';

	const headerStyle = 'uppercase tracking-widest font-bold';

	export let data: PageData;
	$: console.log(data);
</script>

<div class="pb-24 flex flex-col gap-4">
	<!--	Does not contain any of the titles in library.-->
	<div class="pt-24 bg-black">
		<Carousel>
			<div slot="title" class={headerStyle}>For You</div>
			{#await data.streamed.popularMovies}
				<CarouselPlaceholderItems type="large" />
			{:then movies}
				{#each movies ? [...movies].reverse() : [] as movie (movie.tmdbId)}
					<Card type="large" {...movie} />
				{/each}
			{/await}
		</Carousel>
	</div>
	<div>
		<Carousel>
			<div slot="title" class={headerStyle}>Popular Movies</div>
			{#await data.streamed.popularMovies}
				<CarouselPlaceholderItems />
			{:then movies}
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
