<script lang="ts">
	import { getUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import { get, type Readable, type Writable } from 'svelte/store';
	import Container from '../Container.svelte';
	import IconButton from '../FloatingIconButton.svelte';
	import PageDots from '../HeroShowcase/PageDots.svelte';
	import HeroBackground from './HeroBackground.svelte';
	import { Selectable } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { getScrollContext } from '$lib/stores/scroll.store';

	const dispatch = createEventDispatcher();
	const { visibleStyle, visible } = getUiVisibilityContext();
	const { topVisible } = getScrollContext();

	export let items: Promise<{ backdropUrl: string; videoUrl?: string }[]>;
	export let index = 0;
	export let hasFocus = false;

	let selectable: Selectable;

	let length = 0;

	$: items.then((urls) => (length = urls.length));

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

	let heroHasFocusWithin: Readable<boolean>;
	let focusIndex: Writable<number>;
	$: hasFocus = $heroHasFocusWithin && $focusIndex === 0;
	$: visible?.set(!hasFocus || !$topVisible);

	let focusedObject: Selectable | undefined = undefined;
	topVisible?.subscribe((v) => !v && handleClickFocus(true));
	function handleClickFocus(unfocusOnly = false) {
		if (hasFocus && focusedObject) {
			tick().then(() => focusedObject?.focus());
		} else if (!unfocusOnly) {
			focusedObject = get(Selectable.focusedObject);
			selectable?.focusChild(0);
		}
	}
</script>

<Container
	class="flex-1 flex"
	on:enter
	on:select
	on:navigate={(event) => {
		const detail = event.detail;
		if (!hasFocus) return;
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
	bind:hasFocusWithin={heroHasFocusWithin}
	bind:focusIndex
	bind:selectable
>
	<HeroBackground
		{items}
		{index}
		{hasFocus}
		videoVisible={$localSettings.autoplayTrailers ? $topVisible ?? true : !$visible}
	/>
	<div class={classNames('flex flex-1 z-10')}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="flex-1 flex flex-col justify-end" on:click|self={() => handleClickFocus()}>
			<div style={$visibleStyle}>
				<slot />
			</div>
		</div>
		<!-- <div
			class="absolute inset-x-1/2 -translate-x-1/2 top-16 min-w-fit flex flex-col items-center justify-center"
		>
			<ChevronUp size={38} />
			<div class="whitespace-nowrap">View Trailer</div>
		</div> -->
		<div class="flex flex-col justify-end ml-4" style={$visibleStyle}>
			<div class="flex flex-1 justify-end items-center">
				<IconButton on:click={onNext}>
					<ChevronRight size={38} />
				</IconButton>
			</div>
			<PageDots {index} {length} {onJump} {onPrevious} {onNext} />
		</div>
	</div>
</Container>
