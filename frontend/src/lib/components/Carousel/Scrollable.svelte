<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import { onMount, type Snippet } from 'svelte';
	import Container from '../Container.svelte';
	import { Selectable } from '../../selectable';

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onBlur?: ContainerProps['onBlur'];
		direction?: 'horizontal' | 'vertical';
		fadeWidth?: number;
		children?: Snippet<[{ focusIndex: number }]>;
		class?: string;
	}

	let {
		direction = 'horizontal',
		fadeWidth = 6,
		children: content,
		onEnter,
		onBlur,
		class: className
	}: Props = $props();

	const selectable = new Selectable();
	// Whether the content goes on past the start and past the end of the box
	let fadeStart = $state(false);
	let fadeEnd = $state(false);

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

<svelte:window onresize={updateFades} />

<Container
	{selectable}
	{direction}
	class={classNames(
		className,
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
	onscroll={updateFades}
	{onEnter}
	{onBlur}
>
	{#snippet children({ focusIndex })}
		{@render content?.({ focusIndex })}
	{/snippet}
</Container>
