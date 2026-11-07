<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';
	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<div class={classNames('_table-cell', className)}>
	{@render children?.()}
</div>

<style global>
	:global(.row-wrapper > ._table-cell) {
		@apply h-20 flex items-center px-4;
	}

	:global(.row-wrapper-selected > ._table-cell) {
		@apply bg-primary-900;
	}

	:global(.row-wrapper > ._table-cell:first-child) {
		@apply rounded-l-xl pl-12;
	}

	:global(.row-wrapper > ._table-cell:last-child) {
		@apply rounded-r-xl pr-12;
	}

	/*:global(.row-wrapper > ._table-cell:not(:first-child)) {*/
	/*	@apply rounded-l-xl pl-4;*/
	/*}*/
</style>
