<script lang="ts">
	import Hls from 'hls.js';
	import { isTizen } from '../../utils/browser-detection';
	import type { PlaybackInfo, SubtitleInfo } from './VideoPlayer';

	export let playbackInfo: PlaybackInfo | undefined;
	export let subtitleInfo: SubtitleInfo | undefined;

	export let paused = false;
	export let seeking = false;
	export let totalTime = 0;
	export let progressTime = 0;
	export let bufferedTime = 0;
	export let muted = false;
	export let volume = 1;
	export let videoDidLoad = false;
	export let buffering = false;

	export let video: HTMLVideoElement;

	// let hls: Hls | undefined;

	$: playbackInfo && loadPlaybackInfo(playbackInfo);

	function loadPlaybackInfo(playbackInfo: PlaybackInfo) {
		videoDidLoad = false;
		// video.src = '';
		// video.srcObject = null;
		// hls?.destroy();

		const { playbackUrl, directPlay, backdrop, startTime } = playbackInfo;

		if (backdrop) {
			video.poster = backdrop;
		}

		if (!directPlay) {
			if (Hls.isSupported()) {
				console.log('HLS is supported, loading HLS.js');
				const hls = new Hls();

				hls.loadSource(playbackUrl);
				hls.attachMedia(video);
			} else if (video.canPlayType('application/vnd.apple.mpegurl') || isTizen()) {
				/*
				 * HLS.js does NOT work on iOS on iPhone because Safari on iPhone does not support MSE.
				 * This is not a problem, since HLS is natively supported on iOS. But any other browser
				 * that does not support MSE will not be able to play the video.
				 */
				video.src = playbackUrl;
			} else {
				throw new Error('HLS is not supported');
			}
		} else {
			video.src = playbackUrl;
		}

		if (startTime) {
			progressTime = startTime;
		}
	}

	function handleProgress() {
		let timeRanges = video.buffered;
		// Find the first one whose end time is after the current time
		// (the time ranges given by the browser are normalized, which means
		// that they are sorted and non-overlapping)
		for (let i = 0; i < timeRanges.length; i++) {
			if (timeRanges.end(i) > video.currentTime) {
				bufferedTime = timeRanges.end(i);
				break;
			}
		}
	}

	function togglePlay() {
		if (paused) {
			video.play();
		} else {
			video.pause();
		}
	}

	$: if (subtitleInfo?.subtitles) {
		console.log('Unpausing because subtitles were set');
		video.play();
	}
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video
	bind:this={video}
	bind:paused
	bind:duration={totalTime}
	bind:volume
	bind:muted
	on:timeupdate={() => (progressTime = !seeking && videoDidLoad ? video.currentTime : progressTime)}
	on:progress={handleProgress}
	on:loadeddata={() => {
		video.currentTime = progressTime;
		videoDidLoad = true;
		console.log('Video loaded');
	}}
	on:waiting={() => (buffering = true)}
	on:playing={() => (buffering = false)}
	on:dblclick
	on:click={togglePlay}
	autoplay
	playsinline
	crossorigin="anonymous"
	class="w-full h-full"
>
	{#if subtitleInfo?.subtitles}
		<track
			src={subtitleInfo.subtitles.url}
			kind={subtitleInfo.subtitles.kind}
			srclang={subtitleInfo.subtitles.srclang}
			default={true}
			label={subtitleInfo.subtitles.language}
		/>
	{/if}
</video>
