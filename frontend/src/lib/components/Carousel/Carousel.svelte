<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import IconButton from '../FloatingIconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import { PLATFORM_TV } from '../../constants';
	import { Selectable, type KeyEvent } from '../../selectable';
	import { get } from 'svelte/store';
	import { getCardDimensions } from '$lib/utils';
	import { tick, type Snippet } from 'svelte';
	import { smoothScrollTo } from '$lib/scroll-into-view';

	type Props = Omit<ContainerProps, 'children'> & {
		onScrollIndex?: (detail: number) => void;
		hideControls?: boolean;
		horizontalScroll?: boolean;
		focusFirstOnBack?: boolean;
		scrollClass?: string;
		/** The heading text, or a snippet in its place */
		header?: string | Snippet;
		fadeWidth?: number;
		controls?: boolean;
		scrollIndexes?: boolean;
		children?: Snippet<
			[{ focusIndex: number; selectable: Selectable; scrollToIndex: (index: number) => void }]
		>;
	};

	let {
		hideControls = false,
		horizontalScroll = false,
		focusFirstOnBack = true,
		scrollClass = '',
		header = '',
		fadeWidth = 6,
		controls = true,
		scrollIndexes = false,
		children: content,
		onScrollIndex,
		selectable: givenSelectable,
		...rest
	}: Props = $props();

	let carousel: HTMLDivElement | undefined = $state();
	const selectable = givenSelectable ?? new Selectable();
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
	let scrollIndex = 0;
	let scrollPastWidth = $state(0);

	function handleOnBack(e: KeyEvent) {
		const focusIndex = get(e.selectable.focusIndex);

		if (focusIndex !== 0 && focusFirstOnBack) {
			const didFocus = e.selectable.focusChild(0);

			if (didFocus) e.stopPropagation();
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
			onScrollIndex?.(scrollIndex);
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

			let newScrollIndex: number;

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
				onScrollIndex?.(scrollIndex);
			}
		}, 200);
	}

	let startX = 0;
	let scrollLeft = 0;
	let movement = 0;
	let isDown = false;
	let cancelAnimation: (() => void) | undefined;
	let captureClick = $state(false);
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

<div class={classNames('flex flex-col group/carousel', rest.class)}>
	<div class={'flex justify-between items-center mb-2 ' + scrollClass}>
		<div class="h3">
			{#if typeof header === 'function'}{@render header()}{:else}{header}{/if}
		</div>
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
				<IconButton onclick={() => scrollBy(-1)}>
					<ChevronLeft size={20} />
				</IconButton>
				<IconButton onclick={() => scrollBy(1)}>
					<ChevronRight size={20} />
				</IconButton>
			</div>
		{/if}
	</div>

	<div class="relative">
		<Container {selectable} direction="horizontal" {...rest} onBack={handleOnBack}>
			{#snippet children({ focusIndex })}
				<div
					onmousedown={handleMouseDown}
					onmouseup={handleMouseUp}
					onmouseleave={handleMouseLeave}
					onmousemove={handleMouseMove}
					onclickcapture={(e) => {
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
					onscroll={handleScroll}
					onwheel={(e) => {
						if (horizontalScroll && e.deltaY) {
							e.currentTarget.scrollLeft += e.deltaY;
						}
					}}
				>
					{@render content?.({ focusIndex, selectable, scrollToIndex })}
					<div
						style={scrollIndexes ? `width: ${scrollPastWidth}px; height: 1px; flex-shrink: 0;` : ''}
					></div>
				</div>
			{/snippet}
		</Container>
	</div>
</div>
