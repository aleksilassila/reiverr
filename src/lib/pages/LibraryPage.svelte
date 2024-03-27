<script lang="ts">
	import { settings } from '../stores/settings.store';
	import { jellyfinItemsStore } from '../stores/data.store';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import Container from '../../Container.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import CardGrid from '../components/CardGrid.svelte';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';

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

	jellyfinItemsStore.subscribe((items) => {
		console.warn('GOT ITEMS', items.data);
	});
</script>

<Container focusOnMount class="pl-20">
	<div>LibraryPage</div>
	<CardGrid>
		{#await libraryItemsP}
			<CarouselPlaceholderItems />
		{:then items}
			{#each items as item}
				<JellyfinCard {item} />
			{/each}
		{/await}
	</CardGrid>
</Container>
