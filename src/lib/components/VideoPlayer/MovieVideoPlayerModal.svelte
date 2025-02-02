<script lang="ts">
	import { get } from 'svelte/store';
	import { sessions } from '../../stores/session.store';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import type { PlaybackInfo, SubtitleInfo, Subtitles, VideoPlayerContext } from './VideoPlayer';
	import VideoPlayerModal from './VideoPlayerModal.svelte';
	import { getQualities } from '../../apis/jellyfin/qualities';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import type { VideoStreamDto } from '../../apis/reiverr/reiverr.openapi';
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';
	import { onDestroy, onMount } from 'svelte';
	import { createLocalStorageStore } from '../../stores/localstorage.store';
	import Modal from '../Modal/Modal.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import { modalStackTop } from '../Modal/modal.store';

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let sourceId: string;
	export let key: string = '';
	export let progress: number = 0;

	export let modalId: symbol;
	export let hidden: boolean = false;

	let title: string = '';
	let subtitle: string = '';

	let sourceUri = '';

	let playerContext: VideoPlayerContext | undefined;

	type MediaLanguageStore = {
		subtitles?: string;
		audio?: string;
	};

	let video: HTMLVideoElement;
	let paused: boolean;
	let progressTime: number;
	let videoDuration: number;

	let playbackInfo: PlaybackInfo | undefined;
	let subtitleInfo: SubtitleInfo | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	let videoStreamP: Promise<VideoStreamDto>;

	// const movieP = tmdbApi.getTmdbMovie(Number(tmdbId)).then((r) => {
	// 	title = r?.title || '';
	// 	subtitle = '';
	// });

	function reportProgress() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Update progress failed: User not logged in');
			return;
		}

		if (video?.readyState === 4 && video?.currentTime > 0 && video?.duration > 0)
			if (season !== undefined && episode !== undefined) {
				reiverrApiNew.users.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			} else {
				reiverrApiNew.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			}
	}

	const refreshVideoStream = async (audioStreamIndex = 0) => {
		console.log('refreshVideoStream', season, episode);
		videoStreamP = (
			season !== undefined && episode !== undefined
				? reiverrApiNew.sources.getEpisodeStream(sourceId, tmdbId, season, episode, key, {
						// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
						progress,
						audioStreamIndex,
						deviceProfile: getDeviceProfile() as any
				  })
				: reiverrApiNew.sources.getMovieStream(tmdbId, sourceId, key, {
						// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
						progress,
						audioStreamIndex,
						deviceProfile: getDeviceProfile() as any
				  })
		)
			.then((r) => r.data)
			.then((d) => ({
				...d,
				uri: d.uri
			}));

		const stream = await videoStreamP;

		const mediaLanguagesStore = createLocalStorageStore<MediaLanguageStore>(
			'media-tracks-' + title,
			{}
		);

		let subtitles: Subtitles | undefined;

		const availableSubtitles: Subtitles[] = stream.subtitles.map((s) => ({
			kind: 'subtitles',
			srclang: s.label,
			url: get(sessions).activeSession?.baseUrl + s.uri,
			language: s.label
		}));

		const selectSubtitles = (subtitles?: Subtitles) => {
			mediaLanguagesStore.update((prev) => ({
				...prev,
				subtitles: subtitles?.srclang || ''
			}));

			if (subtitleInfo) {
				if (subtitles)
					subtitleInfo = {
						...subtitleInfo,
						subtitles
					};
				else
					subtitleInfo = {
						...subtitleInfo,
						subtitles: undefined
					};
			}
		};

		subtitleInfo = {
			subtitles,
			availableSubtitles,
			selectSubtitles
		};

		playbackInfo = {
			audioStreamIndex: 0, // audioStreamIndex ?? mediaSource?.DefaultAudioStreamIndex ?? -1,
			audioTracks: [],
			// mediaSource?.MediaStreams?.filter((s) => s.Type === 'Audio').map((s) => ({
			// 	index: s.Index || -1,
			// 	language: s.Language || ''
			// })) || [],
			selectAudioTrack: (index: number) => refreshVideoStream(index),
			// loadPlaybackInfo({
			// 	...options,
			// 	audioStreamIndex: index,
			// 	playbackPosition: progressTime * 10_000_000
			// }),
			directPlay: stream.directPlay,
			playbackUrl: (get(sessions).activeSession?.baseUrl || '') + stream.uri,
			backdrop:
				//  item?.BackdropImageTags?.length
				// 	? `${$user?.settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
				// 	:
				'',
			progress: stream.progress
			// (options.playbackPosition || 0) / 10_000_000 ||
			// (item?.UserData?.PlaybackPositionTicks || 0) / 10_000_000 ||
			// undefined
		};
		videoDuration = stream.duration;

		// if (mediaSourceId) reportPlaybackStarted(id, sessionId, mediaSourceId);

		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(
			() => reportProgress(),
			// if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
			// reportProgress(id, sessionId, paused, progressTime);
			10_000
		);
	};

	onMount(() => refreshVideoStream());
	/*
    title
    subtitle
    sections

    sourceUri <- quality
    playbackPosition
    */

	// $: {
	// 	videoStreamP;
	// 	console.log('videoStreamP', videoStreamP);
	// }

	// $: videoStreamP && asd();

	// const asd = () =>
	// 	videoStreamP.then((stream) => {
	// 		// async function loadPlaybackInfo(
	// 		// 		options: { audioStreamIndex?: number; bitrate?: number; playbackPosition?: number } = {}
	// 		// 	) {
	// 		// const item = await itemP;

	// 		// reportProgressInterval = setInterval(() => {
	// 		// 	if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
	// 		// 		reportProgress(id, sessionId, paused, progressTime);
	// 		// }, 10_000);
	// 	});

	onDestroy(() => {
		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgress();

		// if (id && sessionId && progressTime) reportPlaybackStopped(id, sessionId, progressTime);
	});
</script>

<Modal class="bg-black">
	<VideoPlayer
		{playbackInfo}
		modalHidden={$modalStackTop?.id !== modalId}
		{title}
		{subtitle}
		bind:paused
		bind:progressTime
		bind:video
		bind:subtitleInfo
	/>
</Modal>
