<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	import { modalStack } from '../Modal/modal.store';

	export let size: 'sm' | 'full' = 'sm';

	function handleClose() {
		modalStack.closeTopmost();
	}
</script>

<Modal on:back>
	<div
		class="h-full flex items-center justify-center bg-primary-900/75 py-20 px-32"
		transition:fade={{ duration: 100 }}
		on:click|self={() => handleClose()}
	>
		<div
			class={classNames(
				'flex-1 bg-primary-800 rounded-2xl p-10 relative shadow-xl flex flex-col',
				{
					'max-w-lg min-h-0 overflow-y-auto scrollbar-hide': size === 'sm',
					'h-full overflow-hidden': size === 'full'
				},
				$$restProps.class
			)}
		>
			<slot close={handleClose} />
		</div>
	</div>
</Modal>
