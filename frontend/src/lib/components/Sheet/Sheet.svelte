<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import Modal from '../Modal/Modal.svelte';
	import IconButton from '../FloatingIconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';

	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showCloseButton: boolean = true;

	const dispatch = createEventDispatcher<{
		close: null;
	}>();

	function handleClose() {
		dispatch('close');
	}

	$: sizeClasses = {
		sm: 'max-w-xs w-full',
		md: 'w-full',
		lg: 'max-w-md w-full'
	}[size];
</script>

<Container
	trapFocus
	focusOnMount
	class={classNames('fixed inset-0 z-20', $$restProps.class)}
	on:back={({ detail: e }) => {
		handleClose();
		e.stopPropagation();
	}}
>
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-primary-900/75 flex justify-end px-8 pt-16"
		transition:fade={{ duration: 200 }}
		on:click|self={handleClose}
		on:keypress={() => {
			/* For a11y */
		}}
	>
		<!-- Sheet Content -->
		<div
			class={classNames(
				'h-full bg-primary-800 shadow-2xl flex flex-col overflow-hidden rounded-t-xl',
				sizeClasses,
				$$restProps.class
			)}
			transition:fly={{ y: 400, duration: 300, opacity: 1 }}
		>
			<!-- Header with close button -->
			{#if showCloseButton}
				<div class="flex justify-end p-4">
					<IconButton on:click={handleClose}>
						<Cross1 size={20} />
					</IconButton>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto scrollbar-hide p-6 pt-0">
				<slot {handleClose} />
			</div>
		</div>
	</div>
</Container>
