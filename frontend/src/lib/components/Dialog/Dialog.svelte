<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import Modal from '../Modal/Modal.svelte';
	import Panel from '../Panel.svelte';

	interface Props {
		onClose?: ComponentProps<typeof Modal>['onClose'];
		size?: 'sm' | 'full' | 'lg' | 'dynamic';
		children?: Snippet<[{ close: () => void }]>;
		class?: string;
	}

	let { size = 'sm', children: content, onClose, class: className }: Props = $props();
</script>

<Modal {onClose}>
	{#snippet children({ close })}
		<div
			class="h-full flex items-center justify-center bg-primary-900/75 py-20 px-32 overflow-hidden"
			transition:fade|global={{ duration: 100 }}
			onclick={(e) => {
				if (e.target === e.currentTarget) close();
			}}
			onkeypress={() => {
				/* For a11y*/
			}}
		>
			<Panel {size} class={className} onClose={close}>
				{@render content?.({ close })}
			</Panel>
		</div>
	{/snippet}
</Modal>
