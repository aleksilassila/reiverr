<script lang="ts">
	import { setContext } from 'svelte';
	import type { SimpleModalStack } from './modal.store';
	import type { CompStackForPageContext, CompStackPage } from '../StackRouter/stack-router.store';

	export let modalStack: SimpleModalStack;
	setContext<CompStackForPageContext>('stack-router-context', {
		close: () => modalStack.current.set(null),
		push: ({ component, props }) => {
			modalStack.createModal(component, props);
		}
	} as CompStackForPageContext);
</script>

{#if $modalStack}
	<svelte:component this={$modalStack.component} {...$modalStack.props} />
{/if}
