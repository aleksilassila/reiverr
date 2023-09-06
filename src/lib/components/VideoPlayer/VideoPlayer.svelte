<script lang="ts">
	// svelte & misc
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { linear } from 'svelte/easing';
	import classNames from 'classnames';

	// vidstack
	import type { MediaPlayerElement, TextTrack } from 'vidstack';
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
	import { Cross2 as CrossIcon } from 'radix-icons-svelte';
	import CaptionMenu from './CaptionMenu.svelte';
	import IconButton from '../IconButton.svelte';
	import BufferingIcon from './components/BufferingIcon.svelte';
	import TimeSlider from './components/TimeSlider.svelte';
	import PlayPauseButton from './components/PlayPauseButton.svelte';
	import FullscreenButton from './components/FullscreenButton.svelte';

	defineCustomElements();

	export let modalId: symbol;

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
	let subtitleList: Partial<TextTrack>[];

	onMount(() => {
		if (player && $playerState.jellyfinId) {
			if (!videoSource) fetchPlaybackInfo($playerState.jellyfinId);
		}
	});

	function handleClose() {
		playerState.close();
		player.destroy();
		clearInterval(progressInterval);
		modalStack.close(modalId);
	}

	onDestroy(() => {
		player.destroy();
		clearInterval(progressInterval);
	});

	const addSubtitlesToPlayer = () => {
		subtitleList =
			jellyfinItem?.MediaStreams?.filter((item) => item.Type === 'Subtitle').map((subtitle) => {
				return {
					kind: 'subtitles',
					src: `${$settings.jellyfin.baseUrl}/Videos/${jellyfinItem?.Id}/${jellyfinItem?.Id}/Subtitles/${subtitle.Index}/Stream.vtt?api_key=${$settings.jellyfin.apiKey}`,
					index: subtitle.Index,
					language: subtitle.Language,
					label: subtitle.DisplayTitle,
					default: subtitle.IsDefault
				} as Partial<TextTrack>;
			}) ?? [];
		for (const subtitle of subtitleList) {
			player.textTracks.add(subtitle as TextTrack);
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
				item?.UserData?.PlaybackPositionTicks || player?.currentTime * 10_000_000 || 0,
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
					// reportProgress(); // tmp
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
		class="group"
		autoplay
		src={videoSource}
		title={jellyfinItem?.Name}
		poster
		aspect-ratio="16/9"
		crossorigin
		playsinline
		bind:this={player}
	>
		<media-outlet>
			<media-poster alt={jellyfinItem?.Name} />
		</media-outlet>
		<media-captions />
		<!-- VideoUi -->
		<div class="group-data-[user-idle]:opacity-0 transition-opacity">
			<!-- Controls -->
			<div class="absolute bottom-3 left-0 w-full z-10 px-0 py-0.5 bg-black/30 rounded-lg">
				<TimeSlider />
				<div class="w-full flex items-center px-5 mb-1.5 h-5">
					<PlayPauseButton />
					<div class="flex-1" />
					{#if player?.textTracks?.length > 0}
						<media-caption-button class="text-zinc-400 h-8 w-8" />
					{/if}
					<FullscreenButton />
				</div>
			</div>
			<BufferingIcon />
		</div>
	</media-player>
	<div class="absolute top-6 right-6 z-50" transition:fade={{ duration: 100 }}>
		<IconButton on:click={handleClose}>
			<CrossIcon size={25} />
		</IconButton>
		<BufferingIcon />
	</div>
</div>
