<script lang="ts">
	import {
		componentStackContext,
		type ComponentStackStore
	} from '$lib/stores/component-stack.store';
	import classNames from 'classnames';
	import { setContext } from 'svelte';
	import { derived } from 'svelte/store';

	export let componentStack: ComponentStackStore = componentStackContext.createContext();
	setContext('component-stack-index', 0);

	const bottom = derived(componentStack, ($componentStack) => $componentStack[0]);
	const top = derived(
		componentStack,
		($componentStack) => $componentStack[$componentStack.length - 1]
	);
</script>

<div class={classNames('relative', $$restProps.class)}>
	{#if $bottom}
		<svelte:component this={$bottom.component} {...$bottom.props} />
	{/if}
</div>
