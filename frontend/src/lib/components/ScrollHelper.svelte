<script lang="ts">
	import { onMount } from 'svelte';
	import { getScrollParent } from '$lib/scroll-into-view';
	import { getScrollContext } from '$lib/stores/scroll.store';

	interface Props {
		scrollTop?: number;
		scrollLeft?: number;
	}

	let { scrollTop = $bindable(0), scrollLeft = $bindable(0) }: Props = $props();

	const scrollStore = getScrollContext();
	if (!scrollStore.scrollLeft || !scrollStore.scrollTop)
		console.error('ScrollHelper requires ScrollStore');

	$effect(() => {
		scrollStore.scrollTop?.set(scrollTop);
	});
	$effect(() => {
		scrollStore.scrollLeft?.set(scrollLeft);
	});

	let div: HTMLElement | undefined = $state();

	onMount(() => {
		if (!div) return;
		const verticalScrollParent = getScrollParent(div, 'vertical', false);
		const horizontalScrollParent = getScrollParent(div, 'horizontal', false);

		function handler() {
			scrollTop = verticalScrollParent ? verticalScrollParent.scrollTop : scrollTop;
			scrollLeft = horizontalScrollParent ? horizontalScrollParent.scrollLeft : scrollLeft;
		}

		verticalScrollParent?.addEventListener('scroll', handler);

		return () => {
			verticalScrollParent?.removeEventListener('scroll', handler);
		};
	});
</script>

<div bind:this={div}></div>
