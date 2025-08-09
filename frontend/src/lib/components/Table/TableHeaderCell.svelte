<div class="_header-cell self-stretch">
	<slot />
</div>

<style global>
	:global(.row-wrapper > ._header-cell) {
		@apply h-12 flex items-center px-4;
	}

	:global(.row-wrapper > ._header-cell:first-child) {
		@apply pl-12;
	}

	:global(.row-wrapper > ._header-cell:last-child) {
		@apply pr-12;
	}
</style>
