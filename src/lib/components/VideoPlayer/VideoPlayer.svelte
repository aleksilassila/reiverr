<script lang="ts">
	// vidstack
	import 'vidstack/styles/defaults.css';
	import 'vidstack/styles/community-skin/video.css';
	import { defineCustomElements } from 'vidstack/elements';

	import {
		delteActiveEncoding as deleteActiveEncoding,
		getJellyfinItem,
		getJellyfinPlaybackInfo,
		reportJellyfinPlaybackProgress,
		reportJellyfinPlaybackStarted,
		reportJellyfinPlaybackStopped
	} from '$lib/apis/jellyfin/jellyfinApi';
	import getDeviceProfile from '$lib/apis/jellyfin/playback-profiles';
	import { getQualities } from '$lib/apis/jellyfin/qualities';
	import { settings } from '$lib/stores/settings.store';
	import { onDestroy, onMount } from 'svelte';
	import classNames from 'classnames';
	import { playerState } from './VideoPlayer';
	import { fade } from 'svelte/transition';
	import { linear } from 'svelte/easing';
	import type { MediaPlayerElement } from 'vidstack';

	defineCustomElements();

	let stopCallback: () => void;
	let deleteEncoding: () => void;
	let reportProgress: () => void;
	let progressInterval: NodeJS.Timeout;

	let player = document.querySelector('media-player') as MediaPlayerElement;

	let poster: string;
	let videoSource: string;
	let resolution: number = 1080;
	let currentBitrate: number = 0;
	let jellyfinItem: Awaited<ReturnType<typeof getJellyfinItem>>;

	onMount(() => {
		if (player && $playerState.jellyfinId) {
			if (!videoSource) fetchPlaybackInfo($playerState.jellyfinId);
		}
	});

	onDestroy(() => {
		clearInterval(progressInterval);
	});

	const fetchPlaybackInfo = (
		itemId: string,
		maxBitrate: number | undefined = undefined,
		starting: boolean = true
	) =>
		getJellyfinItem(itemId).then((item) => {
			jellyfinItem = item;
			getJellyfinPlaybackInfo(
				itemId,
				getDeviceProfile(),
				item?.UserData?.PlaybackPositionTicks || 0,
				maxBitrate || getQualities(item?.Height || 1080)[0].maxBitrate
			).then(async (playbackInfo) => {
				if (!playbackInfo) return;
				const { playbackUri, playSessionId: sessionId, mediaSourceId, directPlay } = playbackInfo;

				if (!playbackUri || !sessionId) {
					console.log('No playback URL or session ID', playbackUri, sessionId);
					return;
				}

				poster = item?.BackdropImageTags?.length
					? `${$settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
					: '';
				videoSource = $settings.jellyfin.baseUrl + playbackUri;

				resolution = item?.Height || 1080;
				currentBitrate = maxBitrate || getQualities(resolution)[0].maxBitrate;

				if (item?.UserData?.PlaybackPositionTicks) {
					player.currentTime = item?.UserData?.PlaybackPositionTicks / 10_000_000;
				}

				// We should not requestFullscreen automatically, as it's not what
				// the user expects. Moreover, most browsers will deny the request
				// if the video takes a while to load.
				// video.play().then(() => videoWrapper.requestFullscreen());

				// A start report should only be sent when the video starts playing,
				// not every time a playback info request is made
				if (mediaSourceId && starting)
					await reportJellyfinPlaybackStarted(itemId, sessionId, mediaSourceId);

				reportProgress = async () => {
					await reportJellyfinPlaybackProgress(
						itemId,
						sessionId,
						player.paused == true,
						player.currentTime * 10_000_000
					);
				};

				if (progressInterval) clearInterval(progressInterval);
				progressInterval = setInterval(() => {
					player && player.currentTime > 0 && sessionId && itemId;
					reportProgress();
				}, 5000);

				deleteEncoding = () => {
					deleteActiveEncoding(sessionId);
				};
				
				stopCallback = () => {
					reportJellyfinPlaybackStopped(itemId, sessionId, player?.currentTime * 10_000_000);
					deleteEncoding();
				};
			});
		});
</script>


<div
	class={classNames(
		'bg-black w-screen h-[100dvh] sm:h-screen relative flex items-center justify-center',
	)}
	in:fade|global={{ duration: 300, easing: linear }}
	out:fade|global={{ duration: 200, easing: linear }}
>
<media-player
	bind:this={player}
	autoplay
	src={videoSource}
	title={jellyfinItem?.Name}
	poster
	aspect-ratio="16/9"
	crossorigin
>
	<media-outlet>
		<media-poster alt={jellyfinItem?.Name} />
		<!-- <track
			src="https://media-files.vidstack.io/sprite-fight/subs/english.vtt"
			label="English"
			srclang="en-US"
			kind="subtitles"
			default
		/>
		<track
			src="https://media-files.vidstack.io/sprite-fight/chapters.vtt"
			srclang="en-US"
			kind="chapters"
			default
		/> -->
	</media-outlet>
	<media-community-skin />
</media-player>
</div>