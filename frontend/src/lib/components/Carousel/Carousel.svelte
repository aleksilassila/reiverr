<script lang="ts">
	import IconButton from '../FloatingIconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { PLATFORM_TV } from '../../constants';
	import { Selectable, type BackEvent } from '../../selectable';
	import { get } from 'svelte/store';
	import { getCardDimensions } from '$lib/utils';
	import { createEventDispatcher, tick } from 'svelte';
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
	let selectable = new Selectable();
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
		carousel?.scrollBy({
			left: (carousel?.clientWidth - 2 * 128 + 32) * multiplier,
			behavior: 'smooth'
		});
	}

	function scrollToIndex(index: number) {
		const el = carousel;
		if (!el) return;

		const _childWidth = getCardDimensions({
			viewportWidth: window.innerWidth,
			orientation: 'landscape'
		}).width;

		if (!_childWidth) return;

		const childWidth = _childWidth + 32;

		scrollPastWidth = el.clientWidth - childWidth - 32 - 128 - 128;
		console.log('scrollPastWidth', scrollPastWidth, el.clientWidth, childWidth);

		if (scrollIndex !== index) {
			scrollIndex = index;
			dispatch('scrollIndex', scrollIndex);
		}

		smoothScrollTo({
			element: el,
			left: index * childWidth
		});
	}

	let lastScrolled = 0;
	function handleScroll() {
		if (PLATFORM_TV) return;

		lastScrolled = performance.now();
		if (!scrollIndexes) return;
		const el = carousel;
		if (!el) return;

		clearTimeout(scrollTimeout);

		console.log('scroll event');

		scrollTimeout = setTimeout(() => {
			if (isDown) return;

			// const _childWidth = el.children[0]?.getBoundingClientRect().width;
			const _childWidth = getCardDimensions({
				viewportWidth: window.innerWidth,
				orientation: 'landscape'
			}).width;

			if (!_childWidth) return;

			const childWidth = _childWidth + 32;

			const scrollLeft = el.scrollLeft;
			const scrollWidth = el.scrollWidth;

			let newScrollIndex = 0;

			if (scrollLeft < childWidth / 2) {
				newScrollIndex = 0;
			} else {
				newScrollIndex = Math.min(
					Math.round(scrollLeft / childWidth),
					selectable.getChildren().length - 1
				);
			}

			console.log(
				'scrolling to',
				newScrollIndex,
				newScrollIndex * childWidth,
				scrollLeft,
				childWidth
			);

			scrollPastWidth = el.clientWidth - childWidth - 32 - 128 - 128;

			if (Math.abs(newScrollIndex * childWidth - scrollLeft) > 5)
				smoothScrollTo({
					element: el,
					left: newScrollIndex * childWidth,
					cb: () => {
						// tick().then(() => clearTimeout(scrollTimeout));
						// requestAnimationFrame(() => clearTimeout(scrollTimeout));
						console.log('clearing timeout');
					}
				});

			selectable.activateChild(newScrollIndex);

			if (newScrollIndex !== scrollIndex) {
				scrollIndex = newScrollIndex;
				console.log('scrollIndex', scrollIndex);
				dispatch('scrollIndex', scrollIndex);
			}
		}, 200);
	}

	let startX = 0;
	let scrollLeft = 0;
	let movement = 0;
	let isDown = false;
	let cancelAnimation: (() => void) | undefined;
	let captureClick = false;
	let unlocked = false;

	function handleMouseUp(e: MouseEvent) {
		// if (e.button !== 0) return;

		isDown = false;

		if (!carousel) return;

		if (Math.abs(movement) > 4 && lastScrolled + 100 > performance.now()) {
			const f = (x: number, c = 1) => c * Math.log(x / c + 1);

			cancelAnimation = smoothScrollTo({
				element: carousel,
				left: carousel.scrollLeft + (movement > 0 ? 1 : -1) * f(Math.abs(movement) * 50, 200),
				duration: f(Math.abs(movement) * 50, 200)
			});
			handleScroll();
		}

		movement = 0;
		lastX = 0;
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;

		captureClick = false;
		isDown = true;
		unlocked = false;

		if (!carousel) return;
		cancelAnimation?.();

		startX = e.pageX - carousel.offsetLeft;
		scrollLeft = carousel.scrollLeft;
	}

	function handleMouseLeave(e: MouseEvent) {
		isDown = false;

		if (!carousel) return;

		if (Math.abs(movement) > 0 && lastScrolled + 100 > performance.now()) {
			const f = (x: number, c = 1) => c * Math.log(x / c + 1);

			cancelAnimation = smoothScrollTo({
				element: carousel,
				left: carousel.scrollLeft + (movement > 0 ? 1 : -1) * f(Math.abs(movement) * 50, 200),
				duration: f(Math.abs(movement) * 50, 200)
			});
			handleScroll();
		}

		captureClick = false;
	}

	let lastX = 0;
	function handleMouseMove(e: MouseEvent) {
		if (isDown && carousel) {
			const x = e.pageX - carousel.offsetLeft;

			if (Math.abs(x - startX) < 5 && !unlocked) {
				return;
			}

			unlocked = true;

			captureClick = true;

			e.preventDefault();
			//Move vertcally
			movement = lastX - x;
			lastX = 0.5 * lastX + 0.5 * x;
			carousel.scrollLeft = scrollLeft - (x - startX);
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
			{selectable}
			on:mount
			direction="horizontal"
			let:focusIndex
			on:enter
			on:navigate
			{...$$restProps}
			on:back={handleOnBack}
		>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				on:mousedown={handleMouseDown}
				on:mouseup={handleMouseUp}
				on:mouseleave={handleMouseLeave}
				on:mousemove={handleMouseMove}
				on:click|capture={(e) => {
					if (captureClick) {
						// console.log('CAPTURED', captureClick);
						e.stopPropagation();
						captureClick = false;
					}
				}}
				class={classNames(
					'flex overflow-x-auto overflow-y-hidden relative scrollbar-hide *:will-change-contents',
					'space-x-8 py-4 w-full',
					{
						// 'snap-x snap-mandatory *:snap-start *:scroll-mx-32': !PLATFORM_TV,
						'select-none': true
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
				<slot {focusIndex} {selectable} {scrollToIndex} />
				<div
					style={scrollIndexes ? `width: ${scrollPastWidth}px; height: 1px; flex-shrink: 0;` : ''}
				/>
			</div>
		</Container>
	</div>
</div>
