<script lang="ts">
	import Hls from 'hls.js';
	import { isTizen } from '../../utils/browser-detection';
	import {
		createErrorNotification,
		createInfoNotification
	} from '../Notifications/notification.store';
	import type { VideoSource } from './VideoPlayer';
	import type { SubtitlesDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { onDestroy, onMount } from 'svelte';

	export let videoSource: VideoSource | undefined;
	// export let subtitles: Subtitles[] = [];
	// export let enabledSubtitle: string = '';
	export let subtitles: SubtitlesDto | undefined = undefined;

	export let video: HTMLVideoElement | undefined;

	export let videoDidLoad = false;
	export let paused = false;
	export let duration = 0;
	export let currentTime = 0;
	export let bufferedTime = 0;
	export let buffering = false;
	export let muted = false;
	export let volume = 1;

	let availableSubtitles: SubtitlesDto[] = [];
	$: if (!availableSubtitles.some((s) => s.src === subtitles?.src) && subtitles) {
		availableSubtitles = [...availableSubtitles, subtitles];
	}

	$: videoSource && loadVideoSource(videoSource);

	function loadVideoSource(videoSource: VideoSource) {
		if (!video) {
			throw new Error('Video element not found');
		}

		videoDidLoad = false;
		// video.src = '';
		// video.srcObject = null;
		// hls?.destroy();

		const { src, directPlay, backdropUrl } = videoSource;
		console.log('setting video source', src, directPlay, backdropUrl);

		if (backdropUrl) {
			video.poster = backdropUrl;
		}

		if (!directPlay) {
			if (Hls.isSupported()) {
				console.log('HLS is supported, loading HLS.js');
				const hls = new Hls();

				hls.loadSource(src);
				hls.attachMedia(video);
			} else if (video.canPlayType('application/vnd.apple.mpegurl') || isTizen()) {
				/*
				 * HLS.js does NOT work on iOS on iPhone because Safari on iPhone does not support MSE.
				 * This is not a problem, since HLS is natively supported on iOS. But any other browser
				 * that does not support MSE will not be able to play the video.
				 */
				video.src = src;
			} else {
				throw new Error('HLS is not supported');
			}
		} else {
			video.src = src;
		}
	}

	function handleProgress() {
		let timeRanges = video!.buffered;
		// Find the first one whose end time is after the current time
		// (the time ranges given by the browser are normalized, which means
		// that they are sorted and non-overlapping)
		for (let i = 0; i < timeRanges.length; i++) {
			if (timeRanges.end(i) > video!.currentTime) {
				bufferedTime = timeRanges.end(i);
				break;
			}
		}
	}

	$: updateSubtitlesVisibility(subtitles);
	const updateSubtitlesVisibility = (subtitle?: SubtitlesDto) => {
		const tracks = video?.textTracks ?? [];
		for (const track of tracks) {
			track.mode = track.id === subtitle?.src ? 'showing' : 'disabled';
		}
	};

	onMount(() => {
		video?.textTracks.addEventListener('addtrack', () => updateSubtitlesVisibility(subtitles));
	});

	onDestroy(() => {
		video?.textTracks.removeEventListener('addtrack', () => updateSubtitlesVisibility(subtitles));
	});
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video
	bind:this={video}
	bind:paused
	bind:duration
	bind:volume
	bind:muted
	bind:currentTime
	on:progress={handleProgress}
	on:loadeddata={() => {
		// console.log('video loaded', video.currentTime, video.duration, playbackInfo?.progress);
		// video.currentTime = progressTime;
		videoDidLoad = true;

		if (video && video.currentTime < video?.duration * (videoSource?.progress || 0)) {
			video.currentTime = video?.duration * (videoSource?.progress || 0);
		}

		console.log('Video loaded');
		createInfoNotification('Video loaded');
	}}
	on:waiting={() => (buffering = true)}
	on:playing={() => (buffering = false)}
	on:dblclick
	on:click
	on:error={(e) => {
		createErrorNotification('Error loading video', 'Unsupported video format');
	}}
	on:loadstart={() => createInfoNotification('Loading video')}
	on:loadedmetadata={() => createInfoNotification('Loaded metadata')}
	autoplay
	playsinline
	crossorigin="anonymous"
	class="w-full h-full"
>
	{#each availableSubtitles as subtitle (subtitle.src)}
		<track
			default={subtitle.src === subtitles?.src}
			id={subtitle.src}
			src={subtitle.src}
			kind={subtitle.kind}
			srclang={subtitle.src}
			label={subtitle.label}
		/>
	{/each}
	<!-- {#each subtitles as subtitle}
		<track
			default={subtitle.url === enabledSubtitle}
			id={subtitle.url}
			src={subtitle.url}
			kind={subtitle.kind}
			srclang={subtitle.srclang}
			label={subtitle.language}
		/>
	{/each} -->
</video>
