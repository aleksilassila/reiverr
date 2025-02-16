<script lang="ts">
	import type {
		MediaSource,
		StreamDto,
		SubtitlesDto as Subtitles
	} from '$lib/apis/reiverr/reiverr.openapi';
	import {
		episodeUserDataStore,
		libraryItemsDataStore,
		movieUserDataStore,
		seriesUserDataStore,
		tmdbMovieDataStore,
		tmdbSeriesDataStore
	} from '$lib/stores/data.store';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import { createLocalStorageStore } from '../../stores/localstorage.store';
	import { sessions } from '../../stores/session.store';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import { modalStackTop } from '../Modal/modal.store';
	import Modal from '../Modal/Modal.svelte';
	import type { SubtitleInfo, VideoSource } from './VideoPlayer';
	import VideoPlayer from './VideoPlayer.svelte';

	export let modalId: symbol;

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let source: MediaSource;
	export let key: string = '';
	export let progress: number = 0;

	let title: string = '';
	let subtitle: string = '';

	const { unsubscribe, ...request } = (
		season !== undefined && episode !== undefined ? tmdbSeriesDataStore : tmdbMovieDataStore
	).subscribe(Number(tmdbId));

	request.subscribe((item) => {
		if (!item) return;
		if ('title' in item) {
			title = item.title ?? title;
		} else if ('name' in item) {
			title = `Episode ${episode}`;
			subtitle = item.name ?? '';
		}
	});

	type MediaLanguageStore = {
		subtitles?: string;
		audio?: string;
	};

	let video: HTMLVideoElement;
	let paused: boolean;

	let videoSource: VideoSource | undefined;
	let subtitleInfo: SubtitleInfo | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	let videoStreamP: Promise<StreamDto>;

	// const movieP = tmdbApi.getTmdbMovie(Number(tmdbId)).then((r) => {
	// 	title = r?.title || '';
	// 	subtitle = '';
	// });

	async function reportProgress() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Update progress failed: User not logged in');
			return;
		}

		if (video?.readyState === 4 && video?.currentTime > 0 && video?.duration > 0)
			if (season !== undefined && episode !== undefined) {
				await reiverrApiNew.users.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			} else {
				await reiverrApiNew.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			}
	}

	const refreshVideoStream = async (audioStreamIndex = 0) => {
		console.log('refreshVideoStream', season, episode);
		videoStreamP = (
			season !== undefined && episode !== undefined
				? reiverrApiNew.sources.getEpisodeStream(source.id, tmdbId, season, episode, key, {
						// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
						progress,
						audioStreamIndex,
						deviceProfile: getDeviceProfile() as any
				  })
				: reiverrApiNew.sources.getMovieStream(tmdbId, source.id, key, {
						// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
						progress,
						audioStreamIndex,
						deviceProfile: getDeviceProfile() as any
				  })
		).then((r) => r.data);

		const stream = await videoStreamP;

		const mediaLanguagesStore = createLocalStorageStore<MediaLanguageStore>(
			'media-tracks-' + title,
			{}
		);

		let subtitles: Subtitles | undefined;

		const selectSubtitles = (subtitles?: Subtitles) => {
			mediaLanguagesStore.update((prev) => ({
				...prev,
				subtitles: subtitles?.lang || ''
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
			availableSubtitles: stream.subtitles.map((s) => ({
				...s,
				src: `${get(sessions).activeSession?.baseUrl || ''}${s.src}`
			})),
			selectSubtitles
		};

		videoSource = {
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
			src: (get(sessions).activeSession?.baseUrl || '') + stream.src,
			backdropUrl:
				//  item?.BackdropImageTags?.length
				// 	? `${$user?.settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
				// 	:
				'',
			progress: stream.progress
			// (options.playbackPosition || 0) / 10_000_000 ||
			// (item?.UserData?.PlaybackPositionTicks || 0) / 10_000_000 ||
			// undefined
		};

		// title = stream.title;
		// subtitle = stream.subtitle;

		// if (mediaSourceId) reportPlaybackStarted(id, sessionId, mediaSourceId);

		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(
			() => reportProgress(),
			// if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
			// reportProgress(id, sessionId, paused, progressTime);
			10_000
		);
	};

	onMount(() => {
		refreshVideoStream();
	});
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
		reportProgress().then(() => {
			if (season !== undefined && episode !== undefined) {
				seriesUserDataStore.refresh(tmdbId);
				episodeUserDataStore.refresh(tmdbId, season, episode);
			} else {
				movieUserDataStore.refresh(tmdbId);
			}
			libraryItemsDataStore.refreshIn(1500);
		});
	});
</script>

<Modal class="bg-black">
	<VideoPlayer
		{videoSource}
		modalHidden={$modalStackTop?.id !== modalId}
		{title}
		{subtitle}
		source={source.name}
		bind:paused
		bind:video
		bind:subtitleInfo
	/>
</Modal>
