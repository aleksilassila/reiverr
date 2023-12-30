<script lang="ts">
	import { Container, navigationContainers } from '../actions/focusAction';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';

	const carouselContainer1 = new Container('carousel').setDirection('horizontal');
	navigationContainers.home.addChild(carouselContainer1);

	const carouselContainer2 = new Container('carousel').setDirection('horizontal');
	navigationContainers.home.addChild(carouselContainer2);
</script>

<div class="flex flex-col">
	<Carousel>
		<CarouselPlaceholderItems container={carouselContainer1} />
	</Carousel>
	<Carousel>
		<CarouselPlaceholderItems container={carouselContainer2} />
	</Carousel>
</div>
