<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';
	import Container from '../Container.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	const componentStack = useComponentStack();

	const dispatch = createEventDispatcher<{
		close: null;
	}>();

	function handleClose() {
		componentStack.close();
		dispatch('close');
	}
</script>

<Container
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0', $$restProps.class)}
	on:back={() => handleClose()}
>
	<slot close={() => handleClose()} />
</Container>
