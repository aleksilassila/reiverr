<script lang="ts">
	import { onDestroy } from 'svelte';
	import ComponentStackContextProvider from './ComponentStackContextProvider.svelte';
	import { useComponentStack } from './component-stack.store';

	export let componentStack = useComponentStack();
	const items = componentStack._items;

	onDestroy(() => {
		componentStack.reset();
	});
</script>

{#each $items as item, i (item.id)}
	<ComponentStackContextProvider
		{...$$restProps}
		{componentStack}
		{item}
		isTop={i === $items.length - 1}
		isHidden={item.group !== $items[$items.length - 1]?.group}
	/>
{/each}
