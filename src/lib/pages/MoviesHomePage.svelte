<script lang="ts">
	import Container from '../../Container.svelte';
	import HeroShowcase from '../components/HeroShowcase/HeroShowcase.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { getShowcasePropsFromTmdbMovie } from '../components/HeroShowcase/HeroShowcase';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import { scrollIntoView } from '../selectable';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { useRequest } from '../stores/data.store';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { Route } from 'svelte-navigator';
	import MoviePage from './MoviePage.svelte';

	const { data: continueWatching, isLoading: isLoadingContinueWatching } = useRequest(
		jellyfinApi.getContinueWatching,
		'movie'
	);
	const { data: recentlyAdded, isLoading: isLoadingRecentlyAdded } = useRequest(
		jellyfinApi.getRecentlyAdded,
		'movie'
	);

	const popularMovies = tmdbApi.getPopularMovies();
</script>

<Container focusOnMount class="flex flex-col">
	<div class="h-[calc(100vh-12rem)] flex px-20">
		<HeroShowcase
			items={popularMovies.then(getShowcasePropsFromTmdbMovie)}
			on:enter={scrollIntoView({ top: 0 })}
		/>
	</div>
	<div class="mt-16">
		<Carousel scrollClass="px-20" on:enter={scrollIntoView({ vertical: 64 })}>
			<div slot="header">
				{$isLoadingContinueWatching || ($isLoadingRecentlyAdded && !$continueWatching?.length)
					? 'Loading...'
					: $continueWatching?.length
					? 'Continue Watching'
					: 'Recently Added'}
			</div>
			{#if $isLoadingContinueWatching || ($isLoadingRecentlyAdded && !$continueWatching?.length)}
				<CarouselPlaceholderItems />
			{:else if $continueWatching?.length}
				<div class="flex -mx-4">
					{#each $continueWatching as item (item.Id)}
						<Container class="m-4" on:enter={scrollIntoView({ horizontal: 64 + 20 })}>
							<JellyfinCard size="lg" {item} />
						</Container>
					{/each}
				</div>
			{:else if $recentlyAdded?.length}
				{#each $recentlyAdded as item (item.Id)}
					<Container on:enter={scrollIntoView({ horizontal: 64 + 20 })}>
						<JellyfinCard size="lg" {item} />
					</Container>
				{/each}
			{/if}
		</Carousel>
	</div>
</Container>

<Route path=":id/*" component={MoviePage} />
