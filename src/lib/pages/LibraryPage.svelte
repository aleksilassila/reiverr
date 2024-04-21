<script lang="ts">
	import { settings } from '../stores/settings.store';
	import { jellyfinItemsStore } from '../stores/data.store';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import Container from '../../Container.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import CardGrid from '../components/CardGrid.svelte';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { scrollIntoView } from '../selectable';
	import { Route } from 'svelte-navigator';
	import MoviePage from './MoviePage.svelte';
	import SeriesPage from '../components/SeriesPage/SeriesPage.svelte';

	const libraryItemsP = jellyfinApi.getLibraryItems();

	settings.update((prev) => ({
		...prev,
		initialised: true,
		jellyfin: {
			...prev.jellyfin,
			apiKey: import.meta.env.VITE_JELLYFIN_API_KEY,
			baseUrl: import.meta.env.VITE_JELLYFIN_BASE_URL,
			userId: import.meta.env.VITE_JELLYFIN_USER_ID
		}
	}));
</script>

<Container focusOnMount class="px-20">
	<div class="my-8">
		<div class="font-medium tracking-wide text-2xl text-zinc-200">Library</div>
	</div>
	<CardGrid>
		{#await libraryItemsP}
			<CarouselPlaceholderItems />
		{:then items}
			{#each items as item}
				<JellyfinCard
					{item}
					on:enter={scrollIntoView({ all: 64 })}
					size="dynamic"
					navigateWithType
				/>
			{/each}
		{/await}
	</CardGrid>
</Container>

<Route path="movie/:id/*" component={MoviePage} />
<Route path="series/:id/*" component={SeriesPage} />
