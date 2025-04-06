<script lang="ts">
	import type { ComponentPage, ComponentStackStore } from '$lib/stores/component-stack.store';
	import { setContext } from 'svelte';
	import { derived, type Readable } from 'svelte/store';

	export let index = 0;
	export let componentStack: ComponentStackStore;
	export let top: Readable<ComponentPage | undefined>;

	$: component = $componentStack[index];
	const hidden = derived(
		top,
		($top) => $top?.group === component?.group && $top?.id !== component?.id
	);

	const componentStackContainerContext = derived(
		[componentStack, top],
		([$componentStack, $top]) => {
			return {
				index: index + 1,
				componentStack,
				top,
				hidden:
					$top?.group === $componentStack[index]?.group && $top?.id !== $componentStack[index]?.id
			};
		}
	);

	setContext('component-stack-container', componentStackContainerContext);
</script>

{#if component}
	<svelte:component
		this={component.component}
		{...component.props}
		modalId={component.id}
		{hidden}
		groupId={component.group}
		modal={component}
	/>
{/if}
