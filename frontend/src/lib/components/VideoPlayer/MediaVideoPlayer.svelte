<script lang="ts">
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';
	import { reiverrApi } from '../../stores/user.store';
	import { videoPlayerContext } from './video-player.store';
	import VideoPlayer from './VideoPlayer.svelte';

	export let title: string;
	export let subtitle = '';
	export let sourceName = '';
	export let source: {
		pluginId: string;
		streamId: string;
	};
	export let progress: number = 0;
	export let handleProgressUpdate: (progress: number) => void;

	const videoPlayer = videoPlayerContext.createContext({ initialProgress: progress });
	const { videoTracks, subtitleTracks } = videoPlayer;

	videoPlayer.progressUpdateHandler = handleProgressUpdate;

	const videoSourceStore = createLocalStorageStore(
		`${source.pluginId}-${source.streamId}-video-source`,
		{
			videoTrackIndex: 0 as number | undefined,
			subtitleTrackIndex: undefined as number | undefined
		}
	);

	$: {
		videoSourceStore.set({
			videoTrackIndex: $videoTracks.current
				? $videoTracks.tracks.findIndex((track) => track.url === $videoTracks.current?.url)
				: undefined,
			subtitleTrackIndex: $subtitleTracks.current
				? $subtitleTracks.tracks.findIndex((track) => track.url === $subtitleTracks.current?.url)
				: undefined
		});
	}

	const stream = reiverrApi.media
		.getStream({
			pluginId: source.pluginId,
			streamId: source.streamId
		})
		.then((r) => r.data)
		.then((stream) => {
			videoTracks.set({
				current: stream.videoTracks?.[$videoSourceStore.videoTrackIndex || 0],
				tracks: stream.videoTracks ?? []
			});
			subtitleTracks.set({
				current:
					$videoSourceStore.subtitleTrackIndex !== undefined
						? stream.subtitleTracks?.[$videoSourceStore.subtitleTrackIndex]
						: undefined,
				tracks: stream.subtitleTracks ?? []
			});
		});
</script>

<VideoPlayer {title} {subtitle} {sourceName} />
