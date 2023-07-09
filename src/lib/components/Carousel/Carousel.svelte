<script lang="ts">
	import { fade } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';

	let carousel;
	let scrollX;
</script>

<div class="flex justify-between items-center mx-8">
	<slot name="title" />
	<div class="flex gap-2">
		<IconButton>
			<ChevronLeft size="20" />
		</IconButton>
		<IconButton>
			<ChevronRight size="20" />
		</IconButton>
	</div>
</div>

<div class="relative">
	<div
		class="flex overflow-x-scroll items-center overflow-y-hidden gap-4 relative pl-8 scrollbar-hide py-4"
		bind:this={carousel}
		on:scroll={() => (scrollX = carousel.scrollLeft)}
	>
		<slot />
	</div>
	{#if scrollX > 0}
		<div
			transition:fade={{ duration: 200 }}
			class="absolute inset-y-4 left-0 w-24 bg-gradient-to-r from-darken"
		/>
	{/if}
	<div class="absolute inset-y-4 right-0 w-24 bg-gradient-to-l from-darken" />
</div>
