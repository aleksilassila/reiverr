<script lang="ts">
	import { PLATFORM_TV } from '$lib/constants';
	import { fade } from 'svelte/transition';
	import type { BackgroundPage } from './BackgroundStack';
	import BackgroundCarousel from './BackgroundCarousel.svelte';

	export let page: BackgroundPage;
	export let hasFocus: boolean;
	export let nextPage: BackgroundPage | undefined = undefined;

	$: backgrounds = page.backgrounds;
	$: index = page.index;
	$: mediaId = page.mediaId;
	$: nextMediaId = nextPage?.mediaId;

	let hidden = false;
	let hiddenTimeout: ReturnType<typeof setTimeout>;
	let bgIndex = -2;
	let bgIndexTimeout: ReturnType<typeof setTimeout>;

	$: updateHidden(!!nextPage);
	function updateHidden(newValue: boolean) {
		clearTimeout(hiddenTimeout);
		if (newValue) {
			hidden = true;
		} else if (hidden) {
			hiddenTimeout = setTimeout(() => {
				hidden = false;
			}, 200);
		}

		// if (hidden) {
		// 	hiddenTimeout = setTimeout(() => {
		// 		hidden = false;
		// 	}, 200);
		// } else if (!!nextPage) {
		// 	hidden = true;
		// }
	}
	// $: updateHidden($mediaId, $nextMediaId);
	// function updateHidden(id: string | undefined, nextId: string | undefined) {
	// 	console.log('updateHidden', id, nextId);
	// 	if (nextId && nextId === id) {
	// 		clearTimeout(hiddenTimeout);
	// 		hiddenTimeout = setTimeout(() => {
	// 			hidden = true;
	// 		}, 2000);
	// 	} else if (nextPage) {
	// 		console.log('hiding');
	// 		hidden = true;
	// 	} else {
	// 		hidden = false;
	// 	}
	// }

	$: updateBgIndex($index);
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
</script>

<!-- {#if !$previousMediaId || $previousMediaId !== $mediaId}
	<div class="absolute inset-0 bg-secondary-900" />
{/if} -->

{#each $backgrounds as { backdropUrl }, i}
	<div
		class="absolute inset-0 bg-center bg-cover"
		class:opacity-0={bgIndex !== i || hidden}
		class:opacity-100={bgIndex === i && !hidden}
		class:scale-110={!hasFocus && !PLATFORM_TV}
		style={`background-image: url('${backdropUrl}'); transition: opacity 200ms, transform 200ms;`}
		in:fade|global={{ duration: 200, delay: 200 }}
	>
		<!-- {#if videoUrl && i === index && $localSettings.enableTrailers}
					<YoutubeVideo
						videoId={videoUrl}
						autoplay={$localSettings.autoplayTrailers}
						visible={$localSettings.autoplayTrailers ? $topVisible ?? true : videoHasFocus}
						hasFocus={videoHasFocus}
						bind:play={videoShouldPlay}
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
								toggleFocusVideo(true);
							}
						}}
					/>
				{/if} -->
	</div>
{/each}
