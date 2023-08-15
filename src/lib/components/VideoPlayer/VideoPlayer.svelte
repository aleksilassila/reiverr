<script lang="ts">
	import {
		getJellyfinItem,
		getJellyfinPlaybackInfo,
		reportJellyfinPlaybackProgress,
		reportJellyfinPlaybackStarted,
		reportJellyfinPlaybackStopped
	} from '$lib/apis/jellyfin/jellyfinApi';
	import getDeviceProfile from '$lib/apis/jellyfin/playback-profiles';
	import classNames from 'classnames';
	import Hls from 'hls.js';
	import { Cross2 } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import IconButton from '../IconButton.svelte';
	import { playerState } from './VideoPlayer';
	import { modalStack } from '../Modal/Modal';
	import { JELLYFIN_BASE_URL } from '$lib/constants';

	export let modalId: symbol;

	let uiVisible = true;

	let video: HTMLVideoElement;
	let mouseMovementTimeout: NodeJS.Timeout;
	let stopCallback: () => void;
	let progressInterval: NodeJS.Timeout;

	const fetchPlaybackInfo = (itemId: string) =>
		getJellyfinItem(itemId).then((item) =>
			getJellyfinPlaybackInfo(
				itemId,
				getDeviceProfile(),
				item?.UserData?.PlaybackPositionTicks || 0
			).then(async (playbackInfo) => {
				if (!playbackInfo) return;
				const { playbackUri, playSessionId: sessionId, mediaSourceId, directPlay } = playbackInfo;

				if (!playbackUri || !sessionId) {
					console.log('No playback URL or session ID', playbackUri, sessionId);
					return;
				}

				video.poster = item?.BackdropImageTags?.length
					? `${JELLYFIN_BASE_URL}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
					: '';

				if (!directPlay) {
					if (!Hls.isSupported()) {
						throw new Error('HLS is not supported');
					}

					const hls = new Hls();

					hls.loadSource(JELLYFIN_BASE_URL + playbackUri);
					hls.attachMedia(video);
				} else {
					video.src = JELLYFIN_BASE_URL + playbackUri;
				}

				if (item?.UserData?.PlaybackPositionTicks) {
					video.currentTime = item?.UserData?.PlaybackPositionTicks / 10_000_000;
				}

				video.play().then(() => video.requestFullscreen());
				if (mediaSourceId) await reportJellyfinPlaybackStarted(itemId, sessionId, mediaSourceId);
				progressInterval = setInterval(() => {
					video && video.readyState === 4 && video?.currentTime > 0 && sessionId && itemId;
					reportJellyfinPlaybackProgress(
						itemId,
						sessionId,
						video?.paused == true,
						video?.currentTime * 10_000_000
					);
				}, 5000);
				stopCallback = () => {
					reportJellyfinPlaybackStopped(itemId, sessionId, video?.currentTime * 10_000_000);
				};
			})
		);

	function handleClose() {
		playerState.close();
		video?.pause();
		clearInterval(progressInterval);
		stopCallback?.();
		modalStack.close(modalId);
	}

	function handleMouseMove() {
		// uiVisible = true;
		// clearTimeout(mouseMovementTimeout);
		// mouseMovementTimeout = setTimeout(() => {
		// 	uiVisible = false;
		// }, 2000);
	}

	onDestroy(() => clearInterval(progressInterval));

	$: {
		if (video && $playerState.jellyfinId) {
			if (video.src === '') fetchPlaybackInfo($playerState.jellyfinId);
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="bg-black w-screen h-screen relative flex items-center justify-center"
	on:mousemove={handleMouseMove}
>
	<!-- svelte-ignore a11y-media-has-caption -->
	<video controls bind:this={video} class="sm:w-full sm:h-full" />
	<div
		class={classNames('absolute top-4 right-8 transition-opacity z-50', {
			'opacity-0': !uiVisible,
			'opacity-100': uiVisible
		})}
	>
		<IconButton on:click={handleClose}>
			<Cross2 size={25} />
		</IconButton>
	</div>
</div>
