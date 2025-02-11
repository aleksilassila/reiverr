<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	import { modalStack } from '../Modal/modal.store';
	import Panel from '../Panel.svelte';

	export let size: 'sm' | 'full' | 'lg' | 'dynamic' = 'sm';

	function handleClose() {
		modalStack.closeTopmost();
	}
</script>

<Modal on:back>
	<div
		class="h-full flex items-center justify-center bg-primary-900/75 py-20 px-32 overflow-hidden"
		transition:fade={{ duration: 100 }}
		on:click|self={() => handleClose()}
		on:keypress={() => {
			/* For a11y*/
		}}
	>
		<Panel {size} class={$$restProps.class} onClose={handleClose}>
			<slot close={handleClose} />
		</Panel>
	</div>
</Modal>
