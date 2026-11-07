<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';

	import Container from '../Container.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';
	interface Props {
		onClose?: () => void;
		children?: Snippet<[{ close: () => void }]>;
		class?: string;
	}

	let { children, onClose, class: className }: Props = $props();

	const componentStack = useComponentStack();

	function handleClose() {
		componentStack.close();
		onClose?.();
	}
</script>

<Container
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0', className)}
	onBack={() => handleClose()}
>
	{@render children?.({ close: () => handleClose() })}
</Container>
