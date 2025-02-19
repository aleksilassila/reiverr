<script lang="ts">
	import { onMount } from 'svelte';
	import { getScrollParent } from '../utils';
	import { getScrollContext } from '$lib/stores/scroll.store';

	export let scrollTop: number = 0;
	export let scrollLeft: number = 0;

	const scrollStore = getScrollContext();
	if (!scrollStore.scrollLeft || !scrollStore.scrollTop)
		console.error('ScrollHelper requires ScrollStore');

	$: scrollStore.scrollTop?.set(scrollTop);
	$: scrollStore.scrollLeft?.set(scrollLeft);

	let div: HTMLElement;

	onMount(() => {
		const verticalScrollParent = getScrollParent(div, 'vertical');
		const horizontalScrollParent = getScrollParent(div, 'horizontal');

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

<div bind:this={div} />
