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
			<div class="text-xl font-semibold text-zinc-300" slot="title">
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
				<div class="flex -mx-4">
					{#each $recentlyAdded as item (item.Id)}
						<Container class="m-4" on:enter={scrollIntoView({ horizontal: 64 + 20 })}>
							<JellyfinCard size="lg" {item} />
						</Container>
					{/each}
				</div>
			{/if}
		</Carousel>
	</div>
</Container>
