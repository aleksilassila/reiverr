<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Container from '../Container.svelte';
	import { modalStack } from './modal.store';
	import classNames from 'classnames';
	import { componentStackContext } from '../ComponentStack/component-stack.store';

	const { componentStack } = componentStackContext.getContext();

	const dispatch = createEventDispatcher<{
		close: null;
	}>();

	function handleClose() {
		componentStack.pop();
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
