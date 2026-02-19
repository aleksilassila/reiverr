<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';
	import Container from '../Container.svelte';

	export let fadeWidth = 6;

	let element: Container;
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

<Container
	direction="horizontal"
	class={classNames(
		$$restProps.class,
		'overflow-x-auto scrollbar-hide relative overflow-y-visible'
	)}
	style={`backface-visibility: hidden; -webkit-mask-image: linear-gradient(to right, transparent, black ${fadeWidth}rem, black calc(100% - ${fadeWidth}rem), transparent);`}
	on:scroll={updateScrollPosition}
	on:enter
	bind:this={element}
	let:focusIndex
>
	<slot {focusIndex} />
</Container>
