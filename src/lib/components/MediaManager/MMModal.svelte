<script lang="ts">
	import classNames from 'classnames';
	import Container from '../../../Container.svelte';
	import { modalStack } from '../Modal/modal.store';

	export let modalId: symbol;
	export let hidden: boolean = false;
</script>

<Container
	on:navigate={({ detail }) => {
		if (detail.direction === 'left' && detail.willLeaveContainer) {
			modalStack.close(modalId);
			detail.preventNavigation();
		}
	}}
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0 bg-stone-950/80 overflow-auto', {
		'opacity-0': hidden
	})}
	canFocusEmpty
>
	<div class="mx-20 py-16">
		<slot />
	</div>
</Container>
