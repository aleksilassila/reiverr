<script lang="ts">
	import { setContext } from 'svelte';
	import type { SimpleModalStack } from './modal.store';
	import type { CompStackForPageContext, CompStackPage } from '../StackRouter/stack-router.store';

	interface Props {
		modalStack: SimpleModalStack;
	}

	let { modalStack }: Props = $props();
	setContext<CompStackForPageContext>('stack-router-context', {
		close: () => modalStack.current.set(null),
		push: ({ component, props }) => {
			modalStack.createModal(component, props);
		}
	} as CompStackForPageContext);
</script>

<!-- An each block and not an if on the store: the item stays what it was after the modal closed,
	while the modal fades out and when it reads a prop after closing itself. A spread of the store's
	props is read when the modal reads one, from a store that is null by then -->
{#each $modalStack ? [$modalStack] : [] as modal (modal)}
	<modal.component {...modal.props} />
{/each}
