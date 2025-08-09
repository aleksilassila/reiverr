<script lang="ts">
	import { type ComponentStackStore } from '$lib/stores/component-stack.store';
	import classNames from 'classnames';
	import { derived } from 'svelte/store';
	import ComponentStackItem from './ComponentStackItem.svelte';

	export let componentStack: ComponentStackStore;
	const top = derived(
		componentStack,
		($componentStack) => $componentStack[$componentStack.length - 1]
	);
</script>

<div class={classNames('relative', $$restProps.class)}>
	<ComponentStackItem {componentStack} {top} />
	<!-- {#each $componentStack as component (component.id)}
		{@const hidden = $top?.group === component.group && $top?.id !== component.id}

		<Container
			disabled={hidden}
			focusOnMount={!hidden}
			trapFocus
			class="fixed inset-0 z-10 overflow-x-hidden overflow-y-auto"
		>
			<svelte:component
				this={component.component}
				{...component.props}
				modalId={component.id}
				{hidden}
				groupId={component.group}
				modal={component}
			/>
		</Container>
	{/each} -->
	<!-- {#each $componentStack as component, index (component.id)}
		{@const hidden = $top?.group === component.group && $top?.id !== component.id}

		<ComponentStackItem2 {index} {component} {hidden} {context} />
	{/each} -->
</div>
