<script lang="ts">
	import { getContext, setContext, type ComponentProps } from 'svelte';
	import { get, type Readable } from 'svelte/store';
	import Container from '../Container.svelte';
	import ComponentStackItem from './ComponentStackItem.svelte';
	import classNames from 'classnames';
	import type { ComponentStackStore } from '$lib/stores/component-stack.store';

	const componentStackIndex = getContext<number>('component-stack-index');
	const { top, ...componentStack } = getContext<ComponentStackStore>('component-stack');

	$: nextComponent = $componentStack[componentStackIndex + 1];
	$: hidden =
		$top?.group !== $componentStack[componentStackIndex]?.group &&
		$top?.id !== $componentStack[componentStackIndex]?.id;

	export let trapFocus = false;
	export let hideSidebar = false;

	// const props = getContext<Readable<ComponentProps<ComponentStackItem> & { hidden: boolean }>>(
	// 	'component-stack-container'
	// );

	setContext('component-stack-index', componentStackIndex + 1);
</script>

<Container
	disabled={hidden}
	focusOnMount={!hidden}
	{trapFocus}
	class={classNames(
		'fixed inset-0 overflow-x-hidden overflow-y-auto scrollbar-hide',
		{
			'z-[21]': hideSidebar,
			'opacity-0': hidden
		},
		$$restProps.class
	)}
	style="backface-visibility: hidden"
>
	<slot />
</Container>

{#if nextComponent}
	<svelte:component this={nextComponent.component} {...nextComponent.props} />
{/if}

<!-- <ComponentStackItem {...$props} /> -->
