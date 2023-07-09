<script lang="ts">
	import { ChevronDown, ChevronLeft, ChevronRight, DotFilled } from 'radix-icons-svelte';
	import IconButton from '$lib/components/IconButton.svelte';

	export let onNext: () => void;
	export let onPrevious: () => void;
	export let index = 0;
	export let length = 0;

	// TODO: Control pages using horizontal scroll
</script>

<div class="relative z-[1] flex gap-8 justify-between items-center col-span-2">
	<IconButton on:click={onPrevious}>
		<ChevronLeft size={24} />
	</IconButton>

	<div class="flex gap-2">
		{#each Array.from({ length }, (_, i) => i) as i}
			{#if i === index}
				<DotFilled size={15} class="opacity-100" />
			{:else}
				<DotFilled size={15} class="opacity-20" />
			{/if}
		{/each}
	</div>

	<IconButton on:click={onNext}>
		<ChevronRight size={24} />
	</IconButton>
</div>
<!--<div class="absolute inset-x-0 bottom-6 flex justify-center mx-auto opacity-50">-->
<!--	<ChevronDown size="20" />-->
<!--</div>-->
