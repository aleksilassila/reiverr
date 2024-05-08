<script lang="ts">
	import classNames from 'classnames';
	import Container from '../../../Container.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import type { PlaybackInfo, Subtitles, SubtitleInfo, AudioTrack } from './VideoPlayer';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import { getQualities } from '../../apis/jellyfin/qualities';
	import { appState } from '../../stores/app-state.store';
	import { onDestroy } from 'svelte';
	import { modalStack, modalStackTop } from '../Modal/modal.store';

	export let id: string;
	export let modalId: symbol;
	export let hidden: boolean = false;

	let video: HTMLVideoElement;
	let paused: boolean;
	let progressTime: number;

	let playbackInfo: PlaybackInfo | undefined;
	let subtitleInfo: SubtitleInfo | undefined;
	let sessionId: string | undefined;

	let reportProgressInterval: ReturnType<typeof setInterval>;

	const reportPlaybackStarted = (id: string, sessionId: string, mediaSourceId: string) =>
		jellyfinApi.reportPlaybackStarted(id, sessionId, mediaSourceId);

	const reportProgress = (id: string, sessionId: string, paused: boolean, progressTime: number) =>
		jellyfinApi.reportPlaybackProgress(id, sessionId, paused, progressTime * 10_000_000);

	const deleteEncoding = (sessionId: string) => jellyfinApi.deleteActiveEncoding(sessionId);

	const reportPlaybackStopped = (id: string, sessionId: string, progressTime: number) => {
		jellyfinApi.reportPlaybackStopped(id, sessionId, progressTime * 10_000_000);
		deleteEncoding(sessionId);
	};

	async function loadPlaybackInfo(
		id: string,
		options: { audioStreamIndex?: number; bitrate?: number; playbackPosition?: number } = {}
	) {
		const itemP = jellyfinApi.getLibraryItem(id);
		const jellyfinPlaybackInfoP = itemP.then((item) =>
			jellyfinApi.getPlaybackInfo(
				id,
				getDeviceProfile(),
				options.playbackPosition || item?.UserData?.PlaybackPositionTicks || 0,
				options.bitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate,
				options.audioStreamIndex || undefined
			)
		);
		const item = await itemP;
		const jellyfinPlaybackInfo = await jellyfinPlaybackInfoP;

		if (!item || !jellyfinPlaybackInfo) {
			console.error('No item or playback info', item, jellyfinPlaybackInfo);
			return;
		}

		const { playbackUri, playSessionId, mediaSourceId, directPlay } = jellyfinPlaybackInfo;

		if (!playbackUri || !playSessionId) {
			console.error('No playback URL or session ID', playbackUri, playSessionId);
			return;
		}

		sessionId = playSessionId;

		const mediaSource = jellyfinPlaybackInfo.MediaSources?.[0];

		let subtitles: Subtitles | undefined;
		for (const stream of mediaSource?.MediaStreams || []) {
			if (stream.Type === 'Subtitle' && stream.IsDefault) {
				subtitles = {
					kind: 'subtitles',
					srclang: stream.Language || '',
					url: `${$appState.user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${stream.Index}/${stream.Level}/Stream.vtt`,
					language: 'English'
				};
			}
		}

		const availableSubtitles =
			mediaSource?.MediaStreams?.filter((s) => s.Type === 'Subtitle').map((s) => ({
				kind: 'subtitles' as const,
				srclang: s.Language || '',
				url: `${$appState.user?.settings.jellyfin.baseUrl}/Videos/${id}/${mediaSource?.Id}/Subtitles/${s.Index}/${s.Level}/Stream.vtt`,
				language: 'English'
			})) || [];

		subtitleInfo = {
			subtitles,
			availableSubtitles
		};

		playbackInfo = {
			audioStreamIndex: options.audioStreamIndex || mediaSource?.DefaultAudioStreamIndex || -1,
			audioTracks:
				mediaSource?.MediaStreams?.filter((s) => s.Type === 'Audio').map((s) => ({
					index: s.Index || -1,
					language: s.Language || ''
				})) || [],
			selectAudioTrack: (index: number) =>
				loadPlaybackInfo(id, {
					...options,
					audioStreamIndex: index,
					playbackPosition: progressTime * 10_000_000
				}),
			directPlay,
			playbackUrl: $appState.user?.settings.jellyfin.baseUrl + playbackUri,
			backdrop: item?.BackdropImageTags?.length
				? `${$appState.user?.settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
				: '',
			startTime:
				(options.playbackPosition || 0) / 10_000_000 ||
				(item?.UserData?.PlaybackPositionTicks || 0) / 10_000_000 ||
				undefined
		};

		if (mediaSourceId) reportPlaybackStarted(id, sessionId, mediaSourceId);

		if (reportProgressInterval) clearInterval(reportProgressInterval);
		reportProgressInterval = setInterval(() => {
			if (video?.readyState === 4 && progressTime > 0 && sessionId && id)
				reportProgress(id, sessionId, paused, progressTime);
		}, 10_000);
	}

	loadPlaybackInfo(id);

	onDestroy(() => {
		if (reportProgressInterval) clearInterval(reportProgressInterval);
		if (id && sessionId && progressTime) reportPlaybackStopped(id, sessionId, progressTime);
	});
</script>

<Container
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0 bg-black overflow-auto', {
		'opacity-0': hidden
	})}
>
	<VideoPlayer
		{playbackInfo}
		modalHidden={$modalStackTop?.id !== modalId}
		bind:paused
		bind:progressTime
		bind:video
		bind:subtitleInfo
	/>
</Container>
