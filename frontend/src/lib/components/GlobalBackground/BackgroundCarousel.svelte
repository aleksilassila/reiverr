<script lang="ts">
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { scrollIntoView, useRegistrar } from '$lib/selectable';

	import BackgroundCard from './BackgroundCard.svelte';
	import type { Background } from './background-stack.store';

	const carousel = useRegistrar();

	interface Props {
		onJumpTo?: (detail: number) => void;
		backgrounds: Background[];
		focusIndex: number;
	}

	let { backgrounds, focusIndex, onJumpTo }: Props = $props();

	$effect(() => {
		$carousel?.activateChild(focusIndex);
	});
</script>

<Carousel
	scrollClass="px-32"
	class="py-12"
	onMounted={carousel.registrar}
	horizontalScroll
	controls={false}
	focusFirstOnBack={false}
>
	{#each backgrounds as background, index}
		<BackgroundCard
			focusedChild={focusIndex === index}
			backdropUri={background.backdropUri}
			onClickOrSelect={(e) => {
				onJumpTo?.(index);
				const el = e.getHtmlElement();
				console.log(e, el);
				if (el) scrollElementIntoView(el, { horizontal: 128 });
			}}
			onEnter={scrollIntoView({ horizontal: 128 })}
		/>
	{/each}
</Carousel>
