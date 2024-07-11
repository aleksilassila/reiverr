<script>
	import classNames from 'classnames';
</script>

<div class={classNames('_table-cell', $$restProps.class)}>
	<slot />
</div>

<style global>
	:global(.row-wrapper > ._table-cell) {
		@apply h-20 flex items-center px-4 border-t-2 border-b-2 border-transparent bg-secondary-800;
	}
	:global(.row-wrapper > ._table-cell:first-child) {
		@apply border-l-2;
	}
	:global(.row-wrapper > ._table-cell:last-child) {
		@apply border-r-2;
	}

	:global(.row-wrapper-selected > ._table-cell) {
		@apply border-primary-500 bg-primary-900;
	}

	:global(.row-wrapper-active > ._table-cell) {
		@apply border-secondary-200/50 bg-primary-900;
	}

	:global(.row-wrapper:hover > ._table-cell) {
		@apply bg-secondary-800/50;
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
