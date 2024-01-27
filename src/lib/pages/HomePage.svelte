<script lang="ts">
	import { Selectable } from '../selectable';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import classNames from 'classnames';

	export let container: Selectable;
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
