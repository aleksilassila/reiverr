<script lang="ts">
	import { fade } from 'svelte/transition';
	import Modal from '../Modal/Modal.svelte';
	import Panel from '../Panel.svelte';

	export let size: 'sm' | 'full' | 'lg' | 'dynamic' = 'sm';
</script>

<Modal on:close let:close>
	<div
		class="h-full flex items-center justify-center bg-primary-900/75 py-20 px-32 overflow-hidden"
		transition:fade={{ duration: 100 }}
		on:click|self={close}
		on:keypress={() => {
			/* For a11y*/
		}}
	>
		<Panel {size} class={$$restProps.class} onClose={close}>
			<slot {close} />
		</Panel>
	</div>
</Modal>
