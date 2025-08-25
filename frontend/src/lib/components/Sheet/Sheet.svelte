<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import Modal from '../Modal/Modal.svelte';
	import IconButton from '../FloatingIconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';
	import classNames from 'classnames';

	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showCloseButton: boolean = true;

	const dispatch = createEventDispatcher<{
		close: null;
	}>();

	function handleClose() {
		dispatch('close');
	}

	$: sizeClasses = {
		'sm': 'max-w-xs w-full',
		'md': 'max-w-sm w-full',
		'lg': 'max-w-md w-full'
	}[size];
</script>

<Modal on:close={handleClose} let:close>
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-primary-900/75 flex justify-end"
		transition:fade={{ duration: 200 }}
		on:click|self={close}
		on:keypress={() => {
			/* For a11y */
		}}
	>
		<!-- Sheet Content -->
		<div
			class={classNames(
				'h-full bg-primary-800 shadow-2xl flex flex-col overflow-hidden',
				sizeClasses,
				$$restProps.class
			)}
			transition:fly={{ x: 400, duration: 300, opacity: 1 }}
		>
			<!-- Header with close button -->
			{#if showCloseButton}
				<div class="flex justify-end p-4">
					<IconButton on:click={close}>
						<Cross1 size={20} />
					</IconButton>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto scrollbar-hide p-6 pt-0">
				<slot {close} />
			</div>
		</div>
	</div>
</Modal>