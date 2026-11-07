<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	import Modal from '../Modal/Modal.svelte';
	import IconButton from '../FloatingIconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';

	interface Props {
		onClose?: () => void;
		size?: 'sm' | 'md' | 'lg';
		showCloseButton?: boolean;
		children?: Snippet<[{ handleClose: () => void }]>;
		class?: string;
	}

	let {
		size = 'md',
		showCloseButton = true,
		children,
		onClose,
		class: className
	}: Props = $props();

	function handleClose() {
		onClose?.();
	}

	let sizeClasses = $derived(
		{
			sm: 'max-w-xs w-full',
			md: 'max-w-sm w-full',
			lg: 'max-w-md w-full'
		}[size]
	);
</script>

<Container
	trapFocus
	focusOnMount
	class={classNames('fixed inset-0 z-20', className)}
	onBack={(e) => {
		handleClose();
		e.stopPropagation();
	}}
>
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-primary-900/75 flex justify-end"
		transition:fade|global={{ duration: 200 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeypress={() => {
			/* For a11y */
		}}
	>
		<!-- Sheet Content -->
		<div
			class={classNames(
				'h-full bg-primary-800 shadow-2xl flex flex-col overflow-hidden',
				sizeClasses,
				className
			)}
			transition:fly|global={{ x: 400, duration: 300, opacity: 1 }}
		>
			<!-- Header with close button -->
			{#if showCloseButton}
				<div class="flex justify-end p-4">
					<IconButton onclick={handleClose}>
						<Cross1 size={20} />
					</IconButton>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto scrollbar-hide p-6 pt-0">
				{@render children?.({ handleClose })}
			</div>
		</div>
	</div>
</Container>
