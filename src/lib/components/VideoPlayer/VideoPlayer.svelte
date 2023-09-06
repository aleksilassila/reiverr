<script lang="ts">
	// svelte & misc
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { linear } from 'svelte/easing';
	import classNames from 'classnames';

	// vidstack
	import type { MediaPlayerElement } from 'vidstack';
	import 'vidstack/styles/defaults.css';
	import 'vidstack/styles/community-skin/video.css';
	import { defineCustomElements } from 'vidstack/elements';

	// jellyfin
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

	// store
	import { settings } from '$lib/stores/settings.store';
	import { modalStack } from '../../stores/modal.store';
	import { playerState } from './VideoPlayer';

	// ui
	import Slider from './Slider.svelte';

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
		player.destroy();
		clearInterval(progressInterval);
	});

	const addSubtitlesToPlayer = () => {
		const subtitleList =
			jellyfinItem?.MediaStreams?.filter((item) => item.Type === 'Subtitle').map((subtitle) => {
				return {
					kind: 'subtitles',
					src: `${$settings.jellyfin.baseUrl}/Videos/${jellyfinItem?.Id}/${jellyfinItem?.Id}/Subtitles/${subtitle.Index}/Stream.vtt?api_key=${$settings.jellyfin.apiKey}`,
					srclang: subtitle.Language,
					label: subtitle.DisplayTitle,
					default: subtitle.IsDefault
				};
			}) ?? [];
		for (const subtitle of subtitleList) {
			// @ts-ignore
			player.textTracks.add(subtitle);
		}
	};

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

				addSubtitlesToPlayer();

				if (item?.UserData?.PlaybackPositionTicks) {
					player.currentTime = item?.UserData?.PlaybackPositionTicks / 10_000_000;
				}

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
					// reportProgress();
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
		'bg-black w-screen h-[100dvh] sm:h-screen relative flex items-center justify-center'
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
			src="https://media-files.vidstack.io/sprite-fight/chapters.vtt"
			srclang="en-US"
			kind="chapters"
			default
		/> -->
		</media-outlet>
		<media-community-skin />
	</media-player>
</div>
