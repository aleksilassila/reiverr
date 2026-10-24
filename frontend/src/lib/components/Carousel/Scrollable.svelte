<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';
	import Container from '../Container.svelte';
	import { Selectable } from '../../selectable';

	export let direction: 'horizontal' | 'vertical' = 'horizontal';
	export let fadeWidth = 6;

	const selectable = new Selectable();
	// Whether the content goes on past the start and past the end of the box
	let fadeStart = false;
	let fadeEnd = false;

	function updateFades() {
		const element = selectable.getHtmlElement();
		if (!element) return;

		if (direction === 'horizontal') {
			fadeStart = element.scrollLeft > 10;
			fadeEnd = element.scrollLeft < element.scrollWidth - element.clientWidth - 10;
		} else {
			fadeStart = element.scrollTop > 10;
			fadeEnd = element.scrollTop < element.scrollHeight - element.clientHeight - 10;
		}
	}

	onMount(updateFades);
</script>

<svelte:window on:resize={updateFades} />

<Container
	{selectable}
	{direction}
	class={classNames(
		$$restProps.class,
		'scrollbar-hide relative',
		direction === 'horizontal'
			? 'overflow-x-auto overflow-y-visible'
			: 'overflow-y-auto overflow-x-visible'
	)}
	style={`backface-visibility: hidden; -webkit-mask-image: linear-gradient(${
		direction === 'horizontal' ? 'to right' : 'to bottom'
	}, ${fadeStart ? 'transparent' : 'black'}, black ${fadeWidth}rem, black calc(100% - ${fadeWidth}rem), ${
		fadeEnd ? 'transparent' : 'black'
	});`}
	on:scroll={updateFades}
	on:enter
	on:blur
	let:focusIndex
>
	<slot {focusIndex} />
</Container>
