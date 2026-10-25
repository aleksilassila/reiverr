<script lang="ts">
	import Hls from 'hls.js';
	import { onDestroy, onMount } from 'svelte';
	import { isTizen } from '../../utils/browser-detection';
	import { getAudioTrackList, videoPlayerContext, type VideoTrack } from './video-player.store';

	const REPORT_PROGRESS_INTERVAL = 10_000;
	const AUDIO_TRACK_EVENTS = ['addtrack', 'removetrack', 'change'];

	const {
		video,
		videoTracks,
		subtitleTracks,
		videoDidLoad,
		paused,
		duration,
		currentTime,
		volume,
		muted,
		error,
		reportProgress,
		handleProgress,
		handleLoadedData,
		handleWaiting,
		handlePlaying,
		updateSubtitlesVisibility,
		updateAudioTracks
	} = videoPlayerContext.getContext();

	let hls: Hls | undefined;

	$: $videoTracks.current && $video && loadVideoTrack($videoTracks.current);
	$: ($subtitleTracks, updateSubtitlesVisibility());

	function loadVideoTrack(track: VideoTrack) {
		if (!$video) return;

		$videoDidLoad = false;
		$error = undefined;
		hls?.destroy();
		hls = undefined;

		// Tizen and Safari play HLS natively, other browsers need hls.js and its MediaSource support
		if (track.type === 'hls' && !isTizen() && Hls.isSupported()) {
			hls = new Hls();
			hls.loadSource(track.src);
			hls.attachMedia($video);
		} else {
			$video.src = track.src;
		}
	}

	function describeError(mediaError: MediaError | null): string {
		switch (mediaError?.code) {
			case MediaError.MEDIA_ERR_NETWORK:
				return 'The video could not be loaded from the server.';
			case MediaError.MEDIA_ERR_DECODE:
				return 'This device cannot decode the video or audio of this file.';
			case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
				return 'This device does not support the format of this file.';
			default:
				return 'The video could not be played.';
		}
	}

	const reportInterval = setInterval(() => {
		if ($video?.readyState === 4) reportProgress();
	}, REPORT_PROGRESS_INTERVAL);

	onMount(() => {
		$video?.textTracks.addEventListener('addtrack', updateSubtitlesVisibility);

		const audioTrackList = $video && getAudioTrackList($video);
		for (const event of AUDIO_TRACK_EVENTS) {
			audioTrackList?.addEventListener(event, updateAudioTracks);
		}
	});

	onDestroy(() => {
		clearInterval(reportInterval);
		reportProgress();

		$video?.textTracks.removeEventListener('addtrack', updateSubtitlesVisibility);
		const audioTrackList = $video && getAudioTrackList($video);
		for (const event of AUDIO_TRACK_EVENTS) {
			audioTrackList?.removeEventListener(event, updateAudioTracks);
		}
		hls?.destroy();
		$video?.pause();
		$video?.removeAttribute('src');
		$video?.load();
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
	on:progress={handleProgress}
	on:loadeddata={handleLoadedData}
	on:waiting={handleWaiting}
	on:playing={handlePlaying}
	on:error={() => ($error = describeError($video?.error ?? null))}
	on:dblclick
	on:click
	autoplay
	crossorigin="anonymous"
	playsinline
	class="w-full h-full"
>
	{#each $subtitleTracks.tracks as subtitle (subtitle.id)}
		<track
			id={subtitle.id}
			src={subtitle.src}
			kind="subtitles"
			srclang={subtitle.lang}
			label={subtitle.label}
		/>
	{/each}
</video>
