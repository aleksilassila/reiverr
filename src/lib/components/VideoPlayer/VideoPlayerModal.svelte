<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import type { VideoSource, Subtitles, SubtitleInfo, AudioTrack } from './VideoPlayer';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import { getQualities } from '../../apis/jellyfin/qualities';
	import { onDestroy } from 'svelte';
	import { modalStack, modalStackTop } from '../Modal/modal.store';
	import { createLocalStorageStore } from '../../stores/localstorage.store';
	import { get } from 'svelte/store';
	import { ISO_2_LANGUAGES } from '../../utils/iso-2-languages';
	import Modal from '../Modal/Modal.svelte';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import { reiverrApi } from '../../apis/reiverr/reiverr-api';
	import type { VideoStreamDto } from '../../apis/reiverr/reiverr.openapi';
	import { sessions } from '../../stores/session.store';

	type MediaLanguageStore = {
		subtitles?: string;
		audio?: string;
	};

	export let videoStreamP: Promise<VideoStreamDto>;
	export let refreshVideoStream: (audioStreamIndex?: number) => Promise<void>;

	export let modalId: symbol;
	export let hidden: boolean = false;

	// const itemP = jellyfinApi.getLibraryItem(id);

	export let title: string = '';
	export let subtitle: string = '';
	// itemP.then((item) => {
	// 	title = item?.Name || '';
	// 	subtitle = `${item?.SeriesName || ''} S${item?.ParentIndexNumber || ''}E${
	// 		item?.IndexNumber || ''
	// 	}`;
	// });

	let video: HTMLVideoElement;
	let paused: boolean;
	let progressTime: number;

	let playbackInfo: VideoSource | undefined;
	let subtitleInfo: SubtitleInfo | undefined;
	let sessionId: string | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	const reportProgress = () => {};

	// $: {
	// 	videoStreamP;
	// 	console.log('videoStreamP', videoStreamP);
	// }

	$: videoStreamP && asd();

	const asd = () =>
		videoStreamP.then((stream) => {
			// async function loadPlaybackInfo(
			// 		options: { audioStreamIndex?: number; bitrate?: number; playbackPosition?: number } = {}
			// 	) {
			// const item = await itemP;
			const mediaLanguagesStore = createLocalStorageStore<MediaLanguageStore>(
				'media-tracks-' + title,
				{}
			);
			// const storedAudioStreamIndex = item?.MediaStreams?.find(
			// 	(s) => s.Type === 'Audio' && s.Language === mediaLanguagesStore.get().audio
			// )?.Index;
			// const audioStreamIndex = options.audioStreamIndex ?? storedAudioStreamIndex ?? undefined;

			// const jellyfinPlaybackInfo = await jellyfinApi.getPlaybackInfo(
			// 	id,
			// 	getDeviceProfile(),
			// 	options.playbackPosition || item?.UserData?.PlaybackPositionTicks || 0,
			// 	options.bitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate,
			// 	audioStreamIndex
			// );

			// if (!item || !jellyfinPlaybackInfo) {
			// 	console.error('No item or playback info', item, jellyfinPlaybackInfo);
			// 	return;
			// }

			// const { playbackUri, playSessionId, mediaSourceId, directPlay } = jellyfinPlaybackInfo;

			// if (!playbackUri || !playSessionId) {
			// 	console.error('No playback URL or session ID', playbackUri, playSessionId);
			// 	return;
			// }

			// sessionId = playSessionId;

			// const mediaSource = jellyfinPlaybackInfo.MediaSources?.[0];

			// const storedSubtitlesLang = mediaLanguagesStore.get().subtitles;

			// if (options.audioStreamIndex) {
			// 	const audioLang = mediaSource?.MediaStreams?.[options.audioStreamIndex]?.Language;
			// 	mediaLanguagesStore.update((prev) => ({
			// 		...prev,
			// 		audio: audioLang || undefined
			// 	}));
			// }

			let subtitles: Subtitles | undefined;
			// for (const stream of mediaSource?.MediaStreams || []) {
			// 	if (
			// 		stream.Type === 'Subtitle' &&
			// 		(storedSubtitlesLang !== undefined
			// 			? stream.Language === storedSubtitlesLang
			// 			: stream.IsDefault)
			// 	) {
			// 		subtitles = {
			// 			kind: 'subtitles',
			// 			srclang: stream.Language || '',
			// 			url: `${$user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${stream.Index}/${stream.Level}/Stream.vtt`,
			// 			// @ts-ignore
			// 			language: ISO_2_LANGUAGES[stream?.Language || '']?.name || 'English'
			// 		};
			// 	}
			// }

			const availableSubtitles: Subtitles[] = stream.subtitles.map((s) => ({
				kind: 'subtitles',
				srclang: s.label,
				url: get(sessions).activeSession?.baseUrl + s.uri,
				language: s.label
			}));
			//  =
			// 	mediaSource?.MediaStreams?.filter((s) => s.Type === 'Subtitle').map((s) => ({
			// 		kind: 'subtitles' as const,
			// 		srclang: s.Language || '',
			// 		url: `${$user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${s.Index}/${s.Level}/Stream.vtt`,
			// 		language: 'English'
			// 	})) || [];

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
				startTime: stream.progress
				// (options.playbackPosition || 0) / 10_000_000 ||
				// (item?.UserData?.PlaybackPositionTicks || 0) / 10_000_000 ||
				// undefined
			};

			// if (mediaSourceId) reportPlaybackStarted(id, sessionId, mediaSourceId);

			if (reportProgressInterval) clearInterval(reportProgressInterval);
			// reportProgressInterval = setInterval(() => {
			// 	if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
			// 		reportProgress(id, sessionId, paused, progressTime);
			// }, 10_000);
		});

	// const reportPlaybackStarted = (id: string, sessionId: string, mediaSourceId: string) =>
	// 	jellyfinApi.reportPlaybackStarted(id, sessionId, mediaSourceId);

	// const reportProgress = (id: string, sessionId: string, paused: boolean, progressTime: number) =>
	// 	jellyfinApi.reportPlaybackProgress(id, sessionId, paused, progressTime * 10_000_000);

	// const deleteEncoding = (sessionId: string) => jellyfinApi.deleteActiveEncoding(sessionId);

	// const reportPlaybackStopped = (id: string, sessionId: string, progressTime: number) => {
	// 	jellyfinApi.reportPlaybackStopped(id, sessionId, progressTime * 10_000_000);
	// 	deleteEncoding(sessionId);
	// };

	// async function loadPlaybackInfo(
	// 	options: { audioStreamIndex?: number; bitrate?: number; playbackPosition?: number } = {}
	// ) {
	// 	const item = await itemP;
	// 	const mediaLanguagesStore = createLocalStorageStore<MediaLanguageStore>(
	// 		'media-tracks-' + (item?.SeriesName || id),
	// 		{}
	// 	);
	// 	const storedAudioStreamIndex = item?.MediaStreams?.find(
	// 		(s) => s.Type === 'Audio' && s.Language === mediaLanguagesStore.get().audio
	// 	)?.Index;
	// 	const audioStreamIndex = options.audioStreamIndex ?? storedAudioStreamIndex ?? undefined;

	// 	const jellyfinPlaybackInfo = await jellyfinApi.getPlaybackInfo(
	// 		id,
	// 		getDeviceProfile(),
	// 		options.playbackPosition || item?.UserData?.PlaybackPositionTicks || 0,
	// 		options.bitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate,
	// 		audioStreamIndex
	// 	);

	// 	if (!item || !jellyfinPlaybackInfo) {
	// 		console.error('No item or playback info', item, jellyfinPlaybackInfo);
	// 		return;
	// 	}

	// 	const { playbackUri, playSessionId, mediaSourceId, directPlay } = jellyfinPlaybackInfo;

	// 	if (!playbackUri || !playSessionId) {
	// 		console.error('No playback URL or session ID', playbackUri, playSessionId);
	// 		return;
	// 	}

	// 	sessionId = playSessionId;

	// 	const mediaSource = jellyfinPlaybackInfo.MediaSources?.[0];

	// 	const storedSubtitlesLang = mediaLanguagesStore.get().subtitles;

	// 	if (options.audioStreamIndex) {
	// 		const audioLang = mediaSource?.MediaStreams?.[options.audioStreamIndex]?.Language;
	// 		mediaLanguagesStore.update((prev) => ({
	// 			...prev,
	// 			audio: audioLang || undefined
	// 		}));
	// 	}

	// 	let subtitles: Subtitles | undefined;
	// 	for (const stream of mediaSource?.MediaStreams || []) {
	// 		if (
	// 			stream.Type === 'Subtitle' &&
	// 			(storedSubtitlesLang !== undefined
	// 				? stream.Language === storedSubtitlesLang
	// 				: stream.IsDefault)
	// 		) {
	// 			subtitles = {
	// 				kind: 'subtitles',
	// 				srclang: stream.Language || '',
	// 				url: `${$user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${stream.Index}/${stream.Level}/Stream.vtt`,
	// 				// @ts-ignore
	// 				language: ISO_2_LANGUAGES[stream?.Language || '']?.name || 'English'
	// 			};
	// 		}
	// 	}

	// 	const availableSubtitles =
	// 		mediaSource?.MediaStreams?.filter((s) => s.Type === 'Subtitle').map((s) => ({
	// 			kind: 'subtitles' as const,
	// 			srclang: s.Language || '',
	// 			url: `${$user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${s.Index}/${s.Level}/Stream.vtt`,
	// 			language: 'English'
	// 		})) || [];

	// 	const selectSubtitles = (subtitles?: Subtitles) => {
	// 		mediaLanguagesStore.update((prev) => ({
	// 			...prev,
	// 			subtitles: subtitles?.srclang || ''
	// 		}));

	// 		if (subtitleInfo) {
	// 			if (subtitles)
	// 				subtitleInfo = {
	// 					...subtitleInfo,
	// 					subtitles
	// 				};
	// 			else
	// 				subtitleInfo = {
	// 					...subtitleInfo,
	// 					subtitles: undefined
	// 				};
	// 		}
	// 	};

	// 	subtitleInfo = {
	// 		subtitles,
	// 		availableSubtitles,
	// 		selectSubtitles
	// 	};

	// 	playbackInfo = {
	// 		audioStreamIndex: audioStreamIndex ?? mediaSource?.DefaultAudioStreamIndex ?? -1,
	// 		audioTracks:
	// 			mediaSource?.MediaStreams?.filter((s) => s.Type === 'Audio').map((s) => ({
	// 				index: s.Index || -1,
	// 				language: s.Language || ''
	// 			})) || [],
	// 		selectAudioTrack: (index: number) =>
	// 			loadPlaybackInfo({
	// 				...options,
	// 				audioStreamIndex: index,
	// 				playbackPosition: progressTime * 10_000_000
	// 			}),
	// 		directPlay,
	// 		playbackUrl: $user?.settings.jellyfin.baseUrl + playbackUri,
	// 		backdrop: item?.BackdropImageTags?.length
	// 			? `${$user?.settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
	// 			: '',
	// 		startTime:
	// 			(options.playbackPosition || 0) / 10_000_000 ||
	// 			(item?.UserData?.PlaybackPositionTicks || 0) / 10_000_000 ||
	// 			undefined
	// 	};

	// 	// if (mediaSourceId) reportPlaybackStarted(id, sessionId, mediaSourceId);

	// 	if (reportProgressInterval) clearInterval(reportProgressInterval);
	// 	// reportProgressInterval = setInterval(() => {
	// 	// 	if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
	// 	// 		reportProgress(id, sessionId, paused, progressTime);
	// 	// }, 10_000);
	// }

	// loadPlaybackInfo();

	onDestroy(() => {
		if (reportProgressInterval) clearInterval(reportProgressInterval);
		// if (id && sessionId && progressTime) reportPlaybackStopped(id, sessionId, progressTime);
	});
</script>

<Modal class="bg-black">
	<VideoPlayer
		videoSource={playbackInfo}
		modalHidden={$modalStackTop?.id !== modalId}
		{title}
		{subtitle}
		bind:paused
		bind:progressTime
		bind:video
		bind:subtitleInfo
	/>
</Modal>
