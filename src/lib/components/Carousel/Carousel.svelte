<script lang="ts">
	import { fade } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';

	export let gradientFromColor = 'from-stone-900';
	export let heading = '';

	let carousel: HTMLDivElement | undefined;
	let scrollX = 0;
</script>

<div class="flex justify-between items-center mx-2 sm:mx-8 gap-4">
	<slot name="title">
		<div class="font-semibold text-xl">{heading}</div>
	</slot>
	<div class="flex gap-2">
		<IconButton
			on:click={() => {
				carousel?.scrollTo({ left: scrollX - carousel?.clientWidth * 0.8, behavior: 'smooth' });
			}}
		>
			<ChevronLeft size={20} />
		</IconButton>
		<IconButton
			on:click={() => {
				carousel?.scrollTo({ left: scrollX + carousel?.clientWidth * 0.8, behavior: 'smooth' });
			}}
		>
			<ChevronRight size={20} />
		</IconButton>
	</div>
</div>

<div class="relative">
	<div
		class="flex overflow-x-scroll items-center overflow-y-hidden gap-4 relative px-2 sm:px-8 scrollbar-hide py-4"
		bind:this={carousel}
		tabindex="-1"
		on:scroll={() => (scrollX = carousel?.scrollLeft || scrollX)}
	>
		<slot />
	</div>
	{#if scrollX > 50}
		<div
			transition:fade={{ duration: 200 }}
			class={'absolute inset-y-4 left-0 w-0 sm:w-16 md:w-24 bg-gradient-to-r ' + gradientFromColor}
		/>
	{/if}
	{#if carousel && scrollX < carousel?.scrollWidth - carousel?.clientWidth - 50}
		<div
			transition:fade={{ duration: 200 }}
			class={'absolute inset-y-4 right-0 w-0 sm:w-16 md:w-24 bg-gradient-to-l ' + gradientFromColor}
		/>
	{/if}
</div>
