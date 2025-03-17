<script lang="ts">
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { scrollIntoView, useRegistrar } from '$lib/selectable';
	import { createEventDispatcher } from 'svelte';
	import BackgroundCard from './BackgroundCard.svelte';
	import type { Background } from './BackgroundStack';

	const dispatch = createEventDispatcher<{
		jumpTo: number;
	}>();
	const carousel = useRegistrar();

	export let backgrounds: Background[];
	export let focusIndex: number;

	$: $carousel?.activateChild(focusIndex);
</script>

<Carousel
	scrollClass="px-32"
	class="py-12"
	on:mount={carousel.registrar}
	horizontalScroll
	controls={false}
	focusFirstOnBack={false}
>
	{#each backgrounds as background, index}
		<BackgroundCard
			backdropUrl={background.backdropUrl}
			on:clickOrSelect={({ detail }) => {
				dispatch('jumpTo', index);
				const el = detail.getHtmlElement();
				console.log(detail, el);
				if (el) scrollElementIntoView(el, { horizontal: 128 });
			}}
			on:enter={scrollIntoView({ horizontal: 128 })}
		/>
	{/each}
</Carousel>
