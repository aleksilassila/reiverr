<script lang="ts">
	import IconButton from '../FloatingIconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { PLATFORM_TV } from '../../constants';
	import type { BackEvent } from '../../selectable';
	import { get } from 'svelte/store';
	import { getCardDimensions } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	import { smoothScrollTo } from '$lib/scroll-into-view';

	export let hideControls = false;
	export let horizontalScroll = false;
	export let focusFirstOnBack = true;

	export let scrollClass = '';
	export let header = '';
	export let fadeWidth = 6;
	export let controls = true;
	export let scrollIndexes = false;

	let carousel: HTMLDivElement | undefined;
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
	let scrollIndex = 0;
	let scrollPastWidth = 0;

	const dispatch = createEventDispatcher<{
		scrollIndex: number;
	}>();

	function handleOnBack({ detail }: BackEvent) {
		const focusIndex = get(detail.selectable.focusIndex);

		if (focusIndex !== 0 && focusFirstOnBack) {
			const didFocus = detail.selectable.focusChild(0);

			if (didFocus) detail.stopPropagation();
		}
	}

	function scrollBy(multiplier: number) {
		if (!scrollIndexes) {
			carousel?.scrollBy({
				left: (carousel?.clientWidth - 2 * 128 + 32) * multiplier,
				behavior: 'smooth'
			});
		} else {
			const distance = getCardDimensions({
				viewportWidth: window.innerWidth,
				orientation: 'landscape'
			}).width;

			carousel?.scrollBy({
				left: distance * multiplier,
				behavior: 'smooth'
			});
		}
	}

	function handleScroll(scrollEvent: Event) {
		if (!scrollIndexes) return;
		const el = scrollEvent.currentTarget as HTMLDivElement;
		if (!el) return;

		clearTimeout(scrollTimeout);

		scrollTimeout = setTimeout(() => {
			const _childWidth = el.children[0]?.getBoundingClientRect().width;

			if (!_childWidth) return;

			const childWidth = _childWidth + 32;

			const scrollLeft = el.scrollLeft;
			const scrollWidth = el.scrollWidth;

			let newScrollIndex = 0;

			if (scrollLeft < childWidth) {
				newScrollIndex = 0;
			} else if (scrollLeft + el.clientWidth > scrollWidth - childWidth) {
				newScrollIndex = Math.round((scrollWidth - el.clientWidth) / childWidth);
			} else {
				newScrollIndex = Math.round(scrollLeft / childWidth);
			}

			console.log('scrolling to', newScrollIndex, newScrollIndex * childWidth);

			scrollPastWidth = el.clientWidth - childWidth - 32 - 128 - 128;

			// smoothScrollTo({
			// 	element: el,
			// 	left: newScrollIndex * childWidth
			// });

			if (newScrollIndex !== scrollIndex) {
				scrollIndex = newScrollIndex;
				console.log('scrollIndex', scrollIndex);
				dispatch('scrollIndex', scrollIndex);
			}
		}, 150);
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
		{#if controls}
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
				<IconButton on:click={() => scrollBy(-1)}>
					<ChevronLeft size={20} />
				</IconButton>
				<IconButton on:click={() => scrollBy(1)}>
					<ChevronRight size={20} />
				</IconButton>
			</div>
		{/if}
	</div>

	<div class="relative">
		<Container
			on:mount
			direction="horizontal"
			let:focusIndex
			on:enter
			on:navigate
			{...$$restProps}
			on:back={handleOnBack}
		>
			<div
				class={classNames(
					'flex overflow-x-auto items-center overflow-y-hidden relative scrollbar-hide',
					'space-x-8 py-4 w-full',
					{
						'snap-x snap-mandatory *:snap-start *:scroll-mx-32': !PLATFORM_TV
					},
					scrollClass
				)}
				style={`backface-visibility: hidden; -webkit-mask-image: linear-gradient(to right, transparent, black ${fadeWidth}rem, black calc(100% - ${fadeWidth}rem), transparent);`}
				bind:this={carousel}
				tabindex="-1"
				on:scroll={handleScroll}
				on:wheel={(e) => {
					if (horizontalScroll && e.deltaY) {
						e.currentTarget.scrollLeft += e.deltaY;
					}
				}}
			>
				<slot {focusIndex} />
				<div
					style={scrollIndexes ? `width: ${scrollPastWidth}px; height: 1px; flex-shrink: 0;` : ''}
				/>
			</div>
		</Container>
	</div>
</div>
