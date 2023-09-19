<script lang="ts">
	import { fade } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';

	export let gradientFromColor = 'from-stone-950';
	export let heading = '';

	let carousel: HTMLDivElement | undefined;
	let scrollX = 0;
	export let scrollClass = '';
</script>

<div class={classNames('flex flex-col gap-4 group/carousel', $$restProps.class)}>
	<div class={'flex justify-between items-center gap-4 ' + scrollClass}>
		<slot name="title">
			<div class="font-semibold text-xl">{heading}</div>
		</slot>
		<div
			class={classNames(
				'flex gap-2 sm:opacity-0 transition-opacity sm:group-hover/carousel:opacity-100',
				{
					hidden: (carousel?.scrollWidth || 0) === (carousel?.clientWidth || 0)
				}
			)}
		>
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
			class={classNames(
				'flex overflow-x-scroll items-center overflow-y-visible gap-4 relative scrollbar-hide p-1',
				scrollClass
			)}
			bind:this={carousel}
			tabindex="-1"
			on:scroll={() => (scrollX = carousel?.scrollLeft || scrollX)}
		>
			<slot />
		</div>
		{#if scrollX > 50}
			<div
				transition:fade={{ duration: 200 }}
				class={'absolute inset-y-0 left-0 w-0 sm:w-16 md:w-24 bg-gradient-to-r ' +
					gradientFromColor}
			/>
		{/if}
		{#if carousel && scrollX < carousel?.scrollWidth - carousel?.clientWidth - 50}
			<div
				transition:fade={{ duration: 200 }}
				class={'absolute inset-y-0 right-0 w-0 sm:w-16 md:w-24 bg-gradient-to-l ' +
					gradientFromColor}
			/>
		{/if}
	</div>
</div>
