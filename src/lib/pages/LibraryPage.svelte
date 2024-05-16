<script lang="ts">
	import { settings } from '../stores/settings.store';
	import { jellyfinItemsStore } from '../stores/data.store';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import Container from '../../Container.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import CardGrid from '../components/CardGrid.svelte';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { scrollIntoView } from '../selectable';

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

<Container focusOnMount class="px-32 py-16">
	<div class="mb-6">
		<div class="header2">Library</div>
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
