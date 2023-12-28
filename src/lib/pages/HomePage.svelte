<script lang="ts">
	import { navigationContainers } from '../actions/focusAction';
	import { fade } from 'svelte/transition';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';

	const homeContainer = navigationContainers.home.getRegisterer();
</script>

<div class="flex flex-col">
	<Carousel>
		<CarouselPlaceholderItems />
	</Carousel>
</div>
