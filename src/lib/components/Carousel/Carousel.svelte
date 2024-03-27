<script lang="ts">
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../../../Container.svelte';

	export let gradientFromColor = 'from-stone-950';
	export let heading = '';

	let carousel: HTMLDivElement | undefined;
	let scrollX = 0;
	export let scrollClass = '';
</script>

<div class={classNames('flex flex-col group/carousel', $$restProps.class)}>
	<div class={'flex justify-between items-center mb-2 ' + scrollClass}>
		<slot name="title">
			<div class="font-semibold text-xl">{heading}</div>
		</slot>
		<div
			class={classNames(
				'flex gap-2 ml-4',
				//'sm:opacity-0 transition-opacity sm:group-hover/carousel:opacity-100',
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
		<Container horizontal>
			<div
				class={classNames(
					'flex overflow-x-scroll items-center overflow-y-visible relative scrollbar-hide',
					scrollClass
				)}
				bind:this={carousel}
				tabindex="-1"
				on:scroll={() => (scrollX = carousel?.scrollLeft || scrollX)}
			>
				<slot />
			</div>
		</Container>
		{#if scrollX > 50}
			<div
				class={'absolute inset-y-0 left-0 w-0 sm:w-16 md:w-24 bg-gradient-to-r ' +
					gradientFromColor}
			/>
		{/if}
		{#if carousel && scrollX < carousel?.scrollWidth - carousel?.clientWidth - 50}
			<div
				class={'absolute inset-y-0 right-0 w-0 sm:w-16 md:w-24 bg-gradient-to-l ' +
					gradientFromColor}
			/>
		{/if}
	</div>
</div>
