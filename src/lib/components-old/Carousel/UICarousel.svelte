<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';

	let element: HTMLDivElement;
	let scrollX = 0;
	let maxScrollX = 0;
	let fadeLeft = false;
	let fadeRight = true;

	$: {
		fadeLeft = scrollX > 10;
		fadeRight = scrollX < maxScrollX - 10;
	}

	function updateScrollPosition() {
		scrollX = element.scrollLeft;
		maxScrollX = element.scrollWidth - element.clientWidth;
	}

	onMount(() => {
		updateScrollPosition();
	});
</script>

<div
	class={classNames($$restProps.class, 'overflow-x-scroll scrollbar-hide relative p-1')}
	style={`mask-image: linear-gradient(to right, transparent 0%, ${
		fadeLeft ? '' : 'black 0%, '
	}black 5%, black 95%, ${fadeRight ? '' : 'black 100%, '}transparent 100%);`}
	on:scroll={updateScrollPosition}
	bind:this={element}
>
	<slot />
</div>
