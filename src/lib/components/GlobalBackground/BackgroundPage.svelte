<script lang="ts">
	import { PLATFORM_TV } from '$lib/constants';
	import type { BackgroundPage } from './background-stack.store';

	export let page: BackgroundPage;
	export let hasFocus: boolean;
	export let nextPage: BackgroundPage | undefined = undefined;

	$: backgrounds = page.backgrounds;
	$: index = page.index;
	$: mediaId = page.mediaId;
	$: nextMediaId = nextPage?.mediaId;

	$: console.log('nextPage', nextPage);
	$: console.log('$nextMediaId', nextMediaId);

	let hidden = false;
	let hiddenTimeout: ReturnType<typeof setTimeout>;
	let bgIndex = -2;
	let bgIndexTimeout: ReturnType<typeof setTimeout>;

	$: hidden = !!nextPage;
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

{#each $backgrounds as { videoUrl, backdropUrl }, i}
	<div
		class="absolute inset-0 bg-center bg-cover"
		class:opacity-0={bgIndex !== i || hidden}
		class:opacity-100={bgIndex === i && !hidden}
		class:scale-110={!hasFocus && !PLATFORM_TV}
		style={`background-image: url('${backdropUrl}'); transition: opacity 500ms, transform 500ms;`}
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
