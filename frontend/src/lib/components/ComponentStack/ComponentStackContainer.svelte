<script lang="ts">
	import type { ComponentStackStore } from '$lib/stores/component-stack.store';
	import classNames from 'classnames';
	import { getContext, setContext } from 'svelte';
	import Container from '../Container.svelte';

	const componentStackIndex = getContext<number>('component-stack-index');
	const { top, ...componentStack } = getContext<ComponentStackStore>('component-stack');

	$: nextComponent = $componentStack[componentStackIndex + 1];
	$: hidden =
		$top?.group !== $componentStack[componentStackIndex]?.group &&
		$top?.id !== $componentStack[componentStackIndex]?.id;

	export let trapFocus = false;
	export let hideSidebar = false;

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
