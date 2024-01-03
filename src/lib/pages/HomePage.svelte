<script lang="ts">
	import { Container } from '../actions/focusAction';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';

	export let container: Container;
</script>

<div class="flex flex-col">
	<Carousel>
		<CarouselPlaceholderItems {container} />
	</Carousel>
	<Carousel>
		<CarouselPlaceholderItems {container} />
	</Carousel>
</div>
