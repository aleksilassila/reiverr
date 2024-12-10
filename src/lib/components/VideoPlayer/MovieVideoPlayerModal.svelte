<script lang="ts">
	import { get } from 'svelte/store';
	import { sessions } from '../../stores/session.store';
	import { reiverrApiNew } from '../../stores/user.store';
	import type { PlaybackInfo, VideoPlayerContext } from './VideoPlayer';
	import VideoPlayerModal from './VideoPlayerModal.svelte';
	import { getQualities } from '../../apis/jellyfin/qualities';
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import type { VideoStreamDto } from '../../apis/reiverr/reiverr.openapi';
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';

	export let tmdbId: string;
	export let sourceId: string;
	export let key: string = '';

	export let modalId: symbol;
	export let hidden: boolean = false;

	let title: string = '';
	let subtitle: string = '';

	let sourceUri = '';

	let playerContext: VideoPlayerContext | undefined;

	let videoStreamP: Promise<VideoStreamDto>;

	const movieP = tmdbApi.getTmdbMovie(Number(tmdbId)).then((r) => {
		title = r?.title || '';
		subtitle = '';
	});

	const refreshVideoStream = async (audioStreamIndex = 0) => {
		console.log('called2');
		videoStreamP = reiverrApiNew.movies
			.getMovieStream(
				tmdbId,
				sourceId,
				{
					key
				},
				{
					// bitrate: getQualities(1080)?.[0]?.maxBitrate || 10000000,
					progress: 0,
					audioStreamIndex,
					deviceProfile: getDeviceProfile() as any
				}
			)
			.then((r) => r.data)
			.then((d) => ({
				...d,
				uri: d.uri
			}));

		await videoStreamP;
	};

	refreshVideoStream();
	/*
    title
    subtitle
    sections

    sourceUri <- quality
    playbackPosition
    */
</script>

<VideoPlayerModal
	{...$$props}
	{modalId}
	{hidden}
	{videoStreamP}
	{refreshVideoStream}
	{title}
	{subtitle}
/>
