<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import type { PlaybackInfo, SubtitleInfo } from './VideoPlayer';
	import { peerflixApi } from '../../apis/peerflix/peerflix-api';
	import { notificationStack } from '../Notifications/notification.store';

	export let link: string;

	export let modalId: symbol;
	export let hidden: boolean = false;

	let title: string = '';
	let subtitle: string = '';

	let video: HTMLVideoElement;
	let paused: boolean;
	let progressTime: number;

	let playbackInfo: PlaybackInfo | undefined;
	let subtitleInfo: SubtitleInfo | undefined;

	const torrentInfo = peerflixApi.getTorrent(link);

	torrentInfo.then((info) => {
		if (!info) {
			notificationStack.createDefault({
				title: 'Error',
				body: 'Failed to get torrent info'
			});
			return;
		}

		title = info.name;
		const file = info.files.sort((a, b) => b.length - a.length)?.[0];

		if (!file) return;

		playbackInfo = {
			directPlay: true,
			playbackUrl: peerflixApi.getBaseUrl() + file.link,
			audioStreamIndex: 0,
			audioTracks: [],
			selectAudioTrack: () => {}
		};
	});

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
