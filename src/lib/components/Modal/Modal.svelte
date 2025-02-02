<script lang="ts">
	import Container from '../Container.svelte';
	import { modalStack } from './modal.store';
	import classNames from 'classnames';
</script>

<Container
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0', $$restProps.class)}
	on:back={() => modalStack.closeTopmost()}
>
	<slot />
</Container>
