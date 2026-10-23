<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';
	import Container from '../Container.svelte';
	import { Selectable } from '../../selectable';

	export let fadeWidth = 6;

	const selectable = new Selectable();
	let fadeLeft = false;
	let fadeRight = false;

	function updateFades() {
		const element = selectable.getHtmlElement();
		if (!element) return;

		fadeLeft = element.scrollLeft > 10;
		fadeRight = element.scrollLeft < element.scrollWidth - element.clientWidth - 10;
	}

	onMount(updateFades);
</script>

<svelte:window on:resize={updateFades} />

<Container
	{selectable}
	direction="horizontal"
	class={classNames(
		$$restProps.class,
		'overflow-x-auto scrollbar-hide relative overflow-y-visible'
	)}
	style={`backface-visibility: hidden; -webkit-mask-image: linear-gradient(to right, ${
		fadeLeft ? 'transparent' : 'black'
	}, black ${fadeWidth}rem, black calc(100% - ${fadeWidth}rem), ${
		fadeRight ? 'transparent' : 'black'
	});`}
	on:scroll={updateFades}
	on:enter
	let:focusIndex
>
	<slot {focusIndex} />
</Container>
