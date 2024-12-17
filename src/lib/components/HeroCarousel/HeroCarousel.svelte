<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroShowcaseBackground from './HeroBackground.svelte';
	import IconButton from '../IconButton.svelte';
	import { ChevronRight } from 'radix-icons-svelte';
	import PageDots from '../HeroShowcase/PageDots.svelte';
	import type { Readable, Writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import classNames from 'classnames';

	const dispatch = createEventDispatcher();

	export let urls: Promise<{ trailerUrl: string; backdropUrl: string }[]>;
	export let index = 0;
	export let hideInterface = false;

	let length = 0;

	$: urls.then((urls) => (length = urls.length));

	function onNext() {
		if (index === length - 1) {
			return false;
		} else {
			index = (index + 1) % length;
		}

		return true;
	}

	function onPrevious() {
		if (index === 0) {
			return false;
		} else {
			index = (index - 1 + length) % length;
		}
		return true;
	}

	function onJump(i: number) {
		index = i;
		return true;
	}

	let hasFocusWithin: Readable<boolean>;
	let focusIndex: Writable<number>;
	$: backgroundHasFocus = $hasFocusWithin && $focusIndex === 0;
</script>

<Container
	class="flex-1 flex"
	on:enter
	on:select
	on:navigate={(event) => {
		const detail = event.detail;
		if (!backgroundHasFocus) return;
		if (detail.direction === 'right') {
			if (onNext()) {
				detail.preventNavigation();
				detail.stopPropagation();
			}
		} else if (detail.direction === 'left') {
			if (onPrevious()) {
				detail.preventNavigation();
				detail.stopPropagation();
			}
		} else {
			dispatch('navigate', detail);
		}
	}}
	bind:hasFocusWithin
	bind:focusIndex
>
	<HeroShowcaseBackground {urls} {index} hasFocus={backgroundHasFocus} {hideInterface} />
	<div
		class={classNames('flex flex-1 z-10 transition-opacity', {
			'opacity-0': hideInterface
		})}
	>
		<slot />
		<div class="flex flex-col justify-end ml-4">
			<div class="flex flex-1 justify-end items-center">
				<IconButton on:click={onNext}>
					<ChevronRight size={38} />
				</IconButton>
			</div>
			<PageDots {index} {length} {onJump} {onPrevious} {onNext} />
		</div>
	</div>
</Container>
