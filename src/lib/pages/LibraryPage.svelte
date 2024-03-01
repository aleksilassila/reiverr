<script lang="ts">
	import { settings } from '../stores/settings.store';
	import { jellyfinItemsStore } from '../stores/data.store';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import Container from '../../Container.svelte';

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

<Container focusOnMount>
	<div>LibraryPage</div>
	<Carousel>
		<CarouselPlaceholderItems />
	</Carousel>
</Container>
