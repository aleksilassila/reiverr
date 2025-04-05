<script lang="ts">
	import type {
		MediaSourceDto,
		StreamDto,
		SubtitlesDto as Subtitles
	} from '$lib/apis/reiverr/reiverr.openapi';
	import {
		episodeUserDataRefresher,
		libraryRefresher,
		movieUserDataRefresher,
		seriesUserDataRefresher
	} from '$lib/stores/data.store';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import { createLocalStorageStore } from '../../stores/localstorage.store';
	import { sessions } from '../../stores/session.store';
	import { reiverrApi, user } from '../../stores/user.store';
	import type { SubtitleInfo, VideoPlayerProps, VideoSource } from './VideoPlayer';
	import VideoPlayer from './VideoPlayer.svelte';

	export let load: VideoPlayerProps['load'] = true;
	export let paused: VideoPlayerProps['paused'] = false;
	export let muted: VideoPlayerProps['muted'] = false;

	export let tmdbId: string;
	export let season: number | undefined = undefined;
	export let episode: number | undefined = undefined;
	export let title: string;
	export let subtitle = '';
	export let source: MediaSourceDto;
	export let streamId: string;
	export let progress: number = 0;

	type MediaLanguageStore = {
		subtitles?: string;
		audio?: string;
	};

	let video: HTMLVideoElement;

	let videoSource: VideoSource | undefined;
	let subtitleInfo: SubtitleInfo | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	let videoStreamP: Promise<StreamDto>;

	async function reportProgress() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Update progress failed: User not logged in');
			return;
		}

		if (video?.readyState === 4 && video?.currentTime > 0 && video?.duration > 0)
			if (season !== undefined && episode !== undefined) {
				await reiverrApi.users.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			} else {
				await reiverrApi.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
					progress: video.currentTime / video?.duration,
					...(video.currentTime / video?.duration > 0.9 && { watched: true })
				});
			}
	}

	const refreshVideoStream = async (audioStreamIndex = 0) => {
		videoStreamP = reiverrApi.sources
			.getStreamAction(source.id, streamId, 'stream', {
				// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
				progress,
				audioStreamIndex,
				deviceProfile: getDeviceProfile() as any
			})
			.then((r) => r.data.stream as any);

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
			directPlay: stream.directPlay,
			src: (get(sessions).activeSession?.baseUrl || '') + stream.src,
			// backdropUrl: '',
			progress: stream.progress
		};

		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(() => reportProgress(), 10_000);
	};

	onMount(() => {
		refreshVideoStream();
	});

	onDestroy(() => {
		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgress().then(() => {
			if (season !== undefined && episode !== undefined) {
				seriesUserDataRefresher.refresh(tmdbId);
				episodeUserDataRefresher.refresh(`${tmdbId}-${season}-${episode}`);
			} else {
				movieUserDataRefresher.refresh(tmdbId);
			}
			libraryRefresher.refreshIn(500);
		});
	});
</script>

<VideoPlayer
	{paused}
	{muted}
	{load}
	{videoSource}
	{title}
	{subtitle}
	source={source.name}
	bind:video
	bind:subtitleInfo
/>
