<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Container from '../Container.svelte';
	import { modalStack } from './modal.store';
	import classNames from 'classnames';

	const dispatch = createEventDispatcher<{
		close: null;
	}>();

	function handleClose() {
		modalStack.closeTopmost();
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
