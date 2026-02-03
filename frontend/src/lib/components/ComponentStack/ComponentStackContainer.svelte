<script lang="ts">
	import {
		componentStackContext,
		type ComponentStackStore
	} from '$lib/stores/component-stack.store';
	import classNames from 'classnames';
	import { getContext, setContext } from 'svelte';
	import Container from '../Container.svelte';

	const componentStackIndex = getContext<number>('component-stack-index');
	const { top, ...componentStack } = componentStackContext.getContext();

	$: nextComponent = $componentStack[componentStackIndex + 1];
	$: component = $componentStack[componentStackIndex];
	$: hidden = $top?.group !== component?.group && $top?.id !== component?.id;

	export let trapFocus = false;
	export let hideSidebar = false;
	export let preventScroll = false;

	setContext('component-stack-index', componentStackIndex + 1);
</script>

<svelte:head>
	{#if ($top?.preventScroll || preventScroll) && $top === component}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

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
