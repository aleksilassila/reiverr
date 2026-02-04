<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import {
		componentStackContext,
		type ComponentPage,
		type ComponentStackStore
	} from './component-stack.store';

	export let componentStack: ComponentStackStore;
	export let item: ComponentPage;
	export let isTop: boolean;
	export let isHidden: boolean;

	componentStackContext.createContext(componentStack, item);
</script>

<svelte:head>
	{#if item.preventScroll && isTop}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

<Container
	disabled={isHidden}
	focusOnMount={!isHidden}
	trapFocus={false}
	class={classNames(
		'fixed inset-0 overflow-x-hidden overflow-y-auto scrollbar-hide',
		{
			'z-[21]': item.sidebar === false,
			'opacity-0': isHidden
		},
		$$restProps.class
	)}
	style="backface-visibility: hidden"
>
	<svelte:component
		this={item.component}
		{...item.props}
		{isTop}
		{isHidden}
		{componentStack}
		page={item}
	/>
</Container>
