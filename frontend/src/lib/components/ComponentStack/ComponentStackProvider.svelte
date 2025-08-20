<script lang="ts">
	import { useComponentStack, type ComponentStackStore } from '$lib/stores/component-stack.store';
	import classNames from 'classnames';
	import { setContext } from 'svelte';
	import { derived } from 'svelte/store';

	export let componentStack: ComponentStackStore = useComponentStack();
	setContext('component-stack', componentStack);
	setContext('component-stack-index', 0);

	const bottom = derived(componentStack, ($componentStack) => $componentStack[0]);
</script>

<div class={classNames('relative', $$restProps.class)}>
	{#if $bottom}
		<svelte:component this={$bottom.component} {...$bottom.props} />
	{/if}
</div>
