<script lang="ts">
	import type { VideoTrackDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Hls from 'hls.js';
	import { onDestroy, onMount } from 'svelte';
	import { isTizen } from '../../utils/browser-detection';
	import {
		createErrorNotification,
		createInfoNotification
	} from '../Notifications/notification.store';
	import { videoPlayerContext } from './VideoPlayer';

	const videoPlayer = videoPlayerContext.getContext();
	const {
		video,
		videoTracks,
		subtitleTracks,
		videoDidLoad,
		paused,
		duration,
		currentTime,
		bufferedTime,
		buffering,
		muted,
		volume,
		handleProgress,
		handleLoadedData,
		handleWaiting,
		handlePlaying,
		updateSubtitlesVisibility
	} = videoPlayer;

	$: $videoTracks.current && $video && loadVideoSource($videoTracks.current);

	function loadVideoSource(track: VideoTrackDto) {
		if (!$video) {
			throw new Error('Video element not found');
		}

		$videoDidLoad = false;

		// const { src, directPlay, backdropUrl } = videoSource;
		// console.log('setting video source', src, directPlay, backdropUrl);

		// if (backdropUrl) {
		// 	$video.poster = backdropUrl;
		// }

		if (track.type === 'hls') {
			if (Hls.isSupported()) {
				console.log('HLS is supported, loading HLS.js');
				const hls = new Hls();

				hls.loadSource(track.url);
				hls.attachMedia($video);
			} else if ($video.canPlayType('application/vnd.apple.mpegurl') || isTizen()) {
				/*
				 * HLS.js does NOT work on iOS on iPhone because Safari on iPhone does not support MSE.
				 * This is not a problem, since HLS is natively supported on iOS. But any other browser
				 * that does not support MSE will not be able to play the video.
				 */
				$video.src = track.url;
			} else {
				throw new Error('HLS is not supported');
			}
		} else {
			$video.src = track.url;
		}

		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(() => {
			let currentTime = $video?.currentTime || 0;
			let duration = $video?.duration || 0;

			if ($video?.readyState === 4 && currentTime > 5 && duration > 0) {
				videoPlayer.progressUpdateHandler(currentTime / duration);
			}
		}, 10_000);
	}

	$: ($subtitleTracks, updateSubtitlesVisibility?.());

	let reportProgressInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		$video?.textTracks.addEventListener('addtrack', () => updateSubtitlesVisibility?.());
	});

	onDestroy(() => {
		let currentTime = $video?.currentTime || 0;
		let duration = $video?.duration || 0;

		if (currentTime > 5 && duration > 0) {
			videoPlayer.progressUpdateHandler(currentTime / duration);
		}

		$video?.textTracks.removeEventListener('addtrack', () => updateSubtitlesVisibility?.());
		$video?.pause();
		$video?.removeAttribute('src');
		$video?.load();

		clearInterval(reportProgressInterval);
	});
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video
	bind:this={$video}
	bind:paused={$paused}
	bind:duration={$duration}
	bind:volume={$volume}
	bind:muted={$muted}
	bind:currentTime={$currentTime}
	on:progress={() => handleProgress()}
	on:loadeddata={() => {
		handleLoadedData();
		console.log('Video loaded');
		createInfoNotification('Video loaded');
	}}
	on:waiting={() => handleWaiting()}
	on:playing={() => handlePlaying()}
	on:dblclick
	on:click
	on:error={() => {
		createErrorNotification('Error loading video', 'Unsupported video format');
	}}
	on:loadstart={() => createInfoNotification('Loading video')}
	on:loadedmetadata={() => createInfoNotification('Loaded metadata')}
	autoplay
	playsinline
	class="w-full h-full"
>
	{#each $subtitleTracks.tracks as subtitle (subtitle.url)}
		<track
			id={subtitle.label ?? subtitle.url}
			src={subtitle.url}
			kind={subtitle.kind}
			srclang={subtitle.lang}
			label={subtitle.label}
		/>
	{/each}
</video>
