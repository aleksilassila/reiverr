<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	import { modalStack } from '../Modal/modal.store';

	export let size: 'sm' | 'full' | 'lg' | 'dynamic' = 'sm';

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
				'bg-primary-800 rounded-2xl p-12 relative shadow-xl flex flex-col transition-[max-width]',
				{
					'flex-1 max-w-lg min-h-0 overflow-y-auto scrollbar-hide': size === 'sm',
					'flex-1 h-full overflow-hidden': size === 'full',
					'flex-1 max-w-[56rem] min-h-0 overflow-y-auto scrollbar-hide': size === 'lg',
					'': size === 'dynamic'
				},
				$$restProps.class
			)}
		>
			<slot close={handleClose} />
		</div>
	</div>
</Modal>
