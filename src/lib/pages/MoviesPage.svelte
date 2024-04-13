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
	<div class="flex flex-col h-screen">
		<div class="flex-1 flex relative px-20">
			<HeroShowcase items={popularMovies.then(getShowcasePropsFromTmdbMovie)} />
		</div>
		<div class="mt-8">
			<Carousel scrollClass="px-20">
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
					<div class="flex -mx-2">
						{#each $continueWatching as item (item.Id)}
							<Container class="m-2" on:enter={scrollIntoView({ left: 64 + 16 })}>
								<JellyfinCard {item} />
							</Container>
						{/each}
					</div>
				{:else if $recentlyAdded?.length}
					<div class="flex -mx-2">
						{#each $recentlyAdded as item (item.Id)}
							<Container class="m-2" on:enter={scrollIntoView({ left: 64 + 16 })}>
								<JellyfinCard {item} />
							</Container>
						{/each}
					</div>
				{/if}
			</Carousel>
		</div>
	</div>
</Container>
