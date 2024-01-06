<script lang="ts">
	import { Container } from '../actions/focusAction';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import classNames from 'classnames';

	export let container: Container;
	const focusWithin = container.hasFocusWithin;
</script>

<div
	class={classNames('flex flex-col', {
		'bg-green-100': $focusWithin
	})}
>
	<Carousel>
		<CarouselPlaceholderItems {container} />
	</Carousel>
	<Carousel>
		<CarouselPlaceholderItems {container} />
	</Carousel>
</div>
