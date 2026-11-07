<script lang="ts">
	import type { Snippet } from 'svelte';
	import Modal from '../Modal/Modal.svelte';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<Modal>
	<div
		class="h-full flex items-center justify-center bg-primary-900/75 py-20 px-32"
		transition:fade|global={{ duration: 100 }}
	>
		<div
			class={classNames(
				'flex-1 bg-primary-800 rounded-2xl p-10 overflow-y-auto min-h-0 max-h-full scrollbar-hide relative shadow-xl',
				className
			)}
		>
			{@render children?.()}
		</div>
	</div>
</Modal>
