<script lang="ts">
	import { PLATFORM_TV } from '$lib/constants';
	import { Selectable } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { getScrollContext } from '$lib/stores/scroll.store';
	import { getUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { type Readable, type Writable } from 'svelte/store';
	import Container from '../Container.svelte';
	import IconButton from '../FloatingIconButton.svelte';
	import PageDots from '../HeroShowcase/PageDots.svelte';
	import YoutubeVideo from '../YoutubeVideo.svelte';

	const dispatch = createEventDispatcher();
	const { visibleStyle, visible } = getUiVisibilityContext();
	const { topVisible } = getScrollContext();

	export let itemsP: Promise<{ backdropUrl: string; videoUrl?: string }[]>;
	export let index = 0;
	export let autoFocusVideo = false;

	let hasFocus = false;
	let videoHasFocus = false;
	let isVideoPlaying = false;
	let bgIndex = -2;
	let bgIndexTimeout: ReturnType<typeof setTimeout>;

	let items: Awaited<typeof itemsP> = [];
	$: itemsP.then((urls) => (items = urls));

	let htmlElements: HTMLDivElement[] = [];
	$: {
		if (htmlElements[index]) {
			htmlElements[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	let heroHasFocusWithin: Readable<boolean>;
	let focusIndex: Writable<number>;
	$: hasFocus = $heroHasFocusWithin && $focusIndex === 0;
	$: visible?.set(!videoHasFocus || !isVideoPlaying || !$topVisible);

	topVisible?.subscribe((v) => !v && handleFocusVideo(true));

	function onNext() {
		if (index === items.length - 1) {
			return false;
		} else {
			index = (index + 1) % items.length;
		}

		if (autoFocusVideo && items[index]?.videoUrl) {
			videoHasFocus = true;
		} else if (!items[index]?.videoUrl) {
			videoHasFocus = false;
		}

		return true;
	}

	function onPrevious() {
		if (index === 0) {
			return false;
		} else {
			index = (index - 1 + items.length) % items.length;
		}

		if (autoFocusVideo && items[index]?.videoUrl) {
			videoHasFocus = true;
		} else if (!items[index]?.videoUrl) {
			videoHasFocus = false;
		}

		return true;
	}

	function onJump(i: number) {
		index = i;
		return true;
	}

	function handleFocusVideo(unfocusOnly = false) {
		if (videoHasFocus) {
			videoHasFocus = false;
		} else if (!unfocusOnly && items[index]?.videoUrl) {
			videoHasFocus = true;
		}
	}

	$: updateBgIndex(index);
	function updateBgIndex(index: number) {
		clearTimeout(bgIndexTimeout);

		bgIndexTimeout = setTimeout(
			() => {
				bgIndex = index;
			},
			bgIndex === -2 ? 1000 : 500
		);
		bgIndex = -1;
	}

	onDestroy(() => bgIndexTimeout && clearTimeout(bgIndexTimeout));
</script>

<Container
	class="flex-1 flex"
	on:enter
	on:select
	on:navigate={(event) => {
		const detail = event.detail;

		if (videoHasFocus) {
			handleFocusVideo(true);
			if (detail.willLeaveContainer) {
				detail.preventNavigation();
				detail.stopPropagation();
			}
			return;
		} else if (detail.direction === 'up') {
			handleFocusVideo();
			return;
		}

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
>
	<!-- <HeroBackground
		{items}
		{index}
		{hasFocus}
		videoVisible={$localSettings.autoplayTrailers ? $topVisible ?? true : !$visible}
	/> -->

	<div class="fixed inset-0" style="-webkit-transform: translate3d(0,0,0);">
		{#if true}
			{#await itemsP then items}
				{#each items as { videoUrl, backdropUrl }, i}
					<div
						class={classNames('absolute inset-0 bg-center bg-cover', {
							'opacity-100': bgIndex === i,
							'opacity-0': bgIndex !== i,
							'scale-110': !hasFocus && !PLATFORM_TV
						})}
						style={`background-image: url('${backdropUrl}'); transition: opacity 500ms, transform 500ms;`}
					>
						{#if videoUrl && i === index && $localSettings.enableTrailers}
							<YoutubeVideo
								videoId={videoUrl}
								autoplay={$localSettings.autoplayTrailers}
								visible={$localSettings.autoplayTrailers ? $topVisible ?? true : videoHasFocus}
								muted={!videoHasFocus}
								on:play={() => {
									isVideoPlaying = true;
								}}
								on:pause={() => {
									isVideoPlaying = false;
								}}
								on:watched={() => {
									if (autoFocusVideo) {
										onNext();
									} else {
										handleFocusVideo(true);
									}
								}}
							/>
						{/if}
					</div>
				{/each}
			{/await}
		{:else}
			<div
				class={classNames('flex overflow-hidden h-full w-full transition-transform duration-500', {
					'scale-110': !hasFocus
				})}
				style="perspective: 1px; -webkit-perspective: 1px;"
			>
				{#await itemsP then items}
					{#each items as { backdropUrl, videoUrl }, i}
						<div
							class="w-full h-full flex-shrink-0 basis-auto relative"
							style="transform-style: preserve-3d; -webkit-transform-style: preserve-3d; overflow: hidden;"
							bind:this={htmlElements[i]}
						>
							<div
								class="w-full h-full flex-shrink-0 basis-auto bg-center bg-cover absolute inset-0"
								style={`background-image: url('${backdropUrl}'); ${
									!PLATFORM_TV &&
									'transform: translateZ(-5px) scale(6); -webkit-transform: translateZ(-5px) scale(6);'
								}`}
							/>
							<!-- {#if videoUrl && mountVideo}
							<YouTubeBackground videoId={videoUrl} backgroundUrl={backdropUrl} />
						{/if} -->
						</div>
					{/each}
				{/await}
			</div>
		{/if}
	</div>

	<div
		class={classNames('absolute inset-0 flex flex-col')}
		style={`-webkit-transform: translate3d(0,0,0); ${$visibleStyle}`}
	>
		<div class="h-screen bg-gradient-to-b from-transparent to-secondary-900" />
		<div class="flex-1 bg-secondary-900" />
	</div>

	<div class={classNames('flex flex-1 z-10')}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="flex-1 flex flex-col justify-end" on:click|self={() => handleFocusVideo()}>
			<div style={$visibleStyle}>
				<slot focusVideo={handleFocusVideo} />
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
			<PageDots {index} length={items.length} {onJump} {onPrevious} {onNext} />
		</div>
	</div>
</Container>
