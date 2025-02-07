<script lang="ts">
	import { onMount } from 'svelte';
	import { getScrollParent } from '../utils';

	export let scrollTop: number = 0;
	export let scrollLeft: number = 0;

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
