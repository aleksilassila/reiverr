<script lang="ts">
	import { PUBLIC_JELLYFIN_URL } from '$env/static/public';
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

	export let modalId: Symbol;

	let uiVisible = false;

	let video: HTMLVideoElement;
	let mouseMovementTimeout: NodeJS.Timeout;
	let stopCallback: () => void;
	let progressInterval: NodeJS.Timeout;

	const fetchPlaybackInfo = (itemId: string) =>
		getJellyfinPlaybackInfo(itemId, getDeviceProfile()).then(
			async ({ playbackUrl: uri, playSessionId: sessionId, mediaSourceId }) => {
				if (!uri || !sessionId) return;

				const item = await getJellyfinItem(itemId);

				const hls = new Hls();

				hls.loadSource(PUBLIC_JELLYFIN_URL + uri);
				hls.attachMedia(video);
				video
					.play()
					.then(() => video.requestFullscreen())
					.then(() => {
						if (item?.UserData?.PlaybackPositionTicks) {
							video.currentTime = item?.UserData?.PlaybackPositionTicks / 10_000_000;
						}
					});
				if (mediaSourceId) await reportJellyfinPlaybackStarted(itemId, sessionId, mediaSourceId);
				progressInterval = setInterval(() => {
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
			}
		);

	function handleClose() {
		playerState.close();
		video?.pause();
		clearInterval(progressInterval);
		stopCallback?.();
		modalStack.close(modalId);
	}

	function handleMouseMove() {
		uiVisible = true;
		clearTimeout(mouseMovementTimeout);
		mouseMovementTimeout = setTimeout(() => {
			uiVisible = false;
		}, 2000);
	}

	onDestroy(() => clearInterval(progressInterval));

	$: {
		if (video && $playerState.jellyfinId) {
			if (!Hls.isSupported()) {
				throw new Error('HLS is not supported');
			}

			if (video.src === '') fetchPlaybackInfo($playerState.jellyfinId);
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="bg-black w-screen h-screen relative" on:mousemove={handleMouseMove}>
	<!-- svelte-ignore a11y-media-has-caption -->
	<video controls bind:this={video} class="w-full h-full inset-0" />
	<div
		class={classNames('absolute top-4 right-8 transition-opacity', {
			'opacity-0': !uiVisible,
			'opacity-100': uiVisible
		})}
	>
		<IconButton on:click={handleClose}>
			<Cross2 size={25} />
		</IconButton>
	</div>
</div>
