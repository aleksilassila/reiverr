<script lang="ts">
	import IconButton from '../FloatingIconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { PLATFORM_TV } from '../../constants';
	import type { BackEvent } from '../../selectable';
	import { get } from 'svelte/store';

	export let hideControls = false;

	let carousel: HTMLDivElement | undefined;
	let scrollX = 0;
	export let scrollClass = '';
	export let header = '';

	function handleOnBack({ detail }: BackEvent) {
		const focusIndex = get(detail.selectable.focusIndex);

		if (focusIndex !== 0) {
			const didFocus = detail.selectable.focusChild(0);

			if (didFocus) detail.stopPropagation();
		}
	}
</script>

<div class={classNames('flex flex-col group/carousel', $$restProps.class)}>
	<div class={'flex justify-between items-center mb-2 ' + scrollClass}>
		{#if header}
			<div class="h3">{header}</div>
		{:else}
			<div class="h3">
				<slot name="header" />
			</div>
		{/if}
		<div
			class={classNames(
				'flex gap-2 ml-4',
				//'sm:opacity-0 transition-opacity sm:group-hover/carousel:opacity-100',
				{
					hidden:
						(carousel?.scrollWidth || 0) === (carousel?.clientWidth || 0) ||
						PLATFORM_TV ||
						hideControls
				}
			)}
		>
			<IconButton
				on:click={() => {
					carousel?.scrollTo({
						left: scrollX - (carousel?.clientWidth - 2 * 128 + 32),
						behavior: 'smooth'
					});
				}}
			>
				<ChevronLeft size={20} />
			</IconButton>
			<IconButton
				on:click={() => {
					carousel?.scrollTo({
						left: scrollX + (carousel?.clientWidth - 2 * 128) + 32,
						behavior: 'smooth'
					});
				}}
			>
				<ChevronRight size={20} />
			</IconButton>
		</div>
	</div>

	<div class="relative">
		<Container
			direction="horizontal"
			let:focusIndex
			on:enter
			{...$$restProps}
			on:back={handleOnBack}
		>
			<div
				class={classNames(
					'flex overflow-x-auto items-center overflow-y-hidden relative scrollbar-hide',
					'space-x-8 py-4 w-full',
					scrollClass
				)}
				style="-webkit-mask-image: linear-gradient(to right, transparent, black 6rem, black calc(100% - 6rem), transparent);"
				bind:this={carousel}
				tabindex="-1"
				on:scroll={() => (scrollX = carousel?.scrollLeft || scrollX)}
			>
				<slot {focusIndex} />
			</div>
		</Container>
	</div>
</div>
