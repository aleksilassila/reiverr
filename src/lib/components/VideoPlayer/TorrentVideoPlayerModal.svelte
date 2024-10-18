<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import type { PlaybackInfo, SubtitleInfo } from './VideoPlayer';
	import { peerflixApi } from '../../apis/peerflix/peerflix-api';
	import { notificationStack } from '../Notifications/notification.store';
	import { reiverrApi } from '../../apis/reiverr/reiverr-api';
	import { onDestroy } from 'svelte';

	export let link: string;
	export let tmdbId: number | undefined = undefined;
	export let seasonNumber: number | undefined = undefined;
	export let episodeNumber: number | undefined = undefined;

	export let modalId: symbol;
	export let hidden: boolean = false;

	let title: string = '';
	let subtitle: string = '';

	let video: HTMLVideoElement;
	let paused: boolean;
	let progressTime: number;

	let playbackInfo: PlaybackInfo | undefined;
	let subtitleInfo: SubtitleInfo | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	const torrentInfo = peerflixApi.getTorrent(link);
	const playbackState =
		tmdbId && seasonNumber && episodeNumber
			? reiverrApi.getPlayState(tmdbId, seasonNumber, episodeNumber)
			: undefined;

	torrentInfo.then(async (info) => {
		if (!info) {
			notificationStack.createDefault({
				title: 'Error',
				body: 'Failed to get torrent info'
			});
			return;
		}

		const playState = await playbackState;

		title = info.name;
		const file = info.files.sort((a, b) => b.length - a.length)?.[0];

		if (!file) return;

		playbackInfo = {
			directPlay: true,
			playbackUrl: peerflixApi.getBaseUrl() + file.link,
			audioStreamIndex: 0,
			audioTracks: [],
			selectAudioTrack: () => {},
			// startTime: playState?.progress || 0
			startTime: 0
		};

		console.log(tmdbId, seasonNumber, episodeNumber);

		clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(reportProgress, 5_000);
	});

	function reportProgress() {
		if (video?.readyState === 4 && progressTime > 0 && tmdbId && seasonNumber && episodeNumber)
			reiverrApi.setPlayState(tmdbId, seasonNumber, episodeNumber, {
				progress: progressTime,
				watched: progressTime / video.duration > 0.9
			});
	}

	function handleError(e: any) {
		const error: MediaError | null = e.target?.error;

		let title = 'Could not play video';
		let body = 'An error occurred while trying to play the video.';

		// TODO: Handle all errors
		if (error) {
			if (error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED && playbackInfo) {
				title = 'Video format not supported';
				body =
					'The video format is not supported by your browser. Video will be transcoded, consider switching to a different browser for better quality.';

				playbackInfo = {
					...playbackInfo,
					playbackUrl: playbackInfo.playbackUrl + '?ffmpeg=remux'
				};
			}
		}

		notificationStack.createDefault({
			title,
			body,
			duration: 8000,
			position: 'center'
		});
	}

	onDestroy(() => {
		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgress();
	});
</script>

<Modal class="bg-black">
	<VideoPlayer
		{playbackInfo}
		modalHidden={hidden}
		{title}
		{subtitle}
		bind:paused
		bind:progressTime
		bind:video
		bind:subtitleInfo
		on:error={handleError}
	/>
</Modal>
