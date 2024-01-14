<script lang="ts">
	import type { Container } from '../actions/focusAction';
	import { settings } from '../stores/settings.store';
	import { jellyfinItemsStore } from '../stores/data.store';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';

	export let parent: Container;
	let registerer = parent.getChildRegisterer();

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
	let asd: HTMLDivElement;
	$: console.log('asd', asd);
</script>

<div use:registerer bind:this={asd}>
	<div>LibraryPage</div>
	<Carousel>
		<CarouselPlaceholderItems container={parent} />
	</Carousel>
</div>
