<script lang="ts">
	import {
		getJellyfinItem,
		getJellyfinPlaybackInfo,
		reportJellyfinPlaybackProgress,
		reportJellyfinPlaybackStarted,
		reportJellyfinPlaybackStopped
	} from '$lib/apis/jellyfin/jellyfinApi';
	import Hls from 'hls.js';
	import Modal from '../Modal/Modal.svelte';
	import IconButton from '../IconButton.svelte';
	import { Cross2 } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { getContext, onDestroy } from 'svelte';
	import { PUBLIC_JELLYFIN_URL } from '$env/static/public';
	import getDeviceProfile from '$lib/apis/jellyfin/playback-profiles';
	import type { PlayerState, PlayerStateValue } from './VideoPlayer';

	const { playerState, close } = getContext<PlayerState>('player');

	let video: HTMLVideoElement;

	let stopCallback: () => void;

	let progressInterval: ReturnType<typeof setInterval>;
	onDestroy(() => clearInterval(progressInterval));

	const fetchPlaybackInfo = (itemId: string) =>
		getJellyfinPlaybackInfo(itemId, getDeviceProfile()).then(
			async ({ playbackUrl: uri, playSessionId: sessionId, mediaSourceId }) => {
				if (!uri || !sessionId) return;

				const item = await getJellyfinItem(itemId);

				const hls = new Hls();

				console.log(item);

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
		close();
		video?.pause();
		clearInterval(progressInterval);
		stopCallback?.();
		playerState.set({ visible: false, jellyfinId: '' });
	}

	let uiVisible = false;
	let timeout: ReturnType<typeof setTimeout>;
	function handleMouseMove() {
		uiVisible = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			uiVisible = false;
		}, 2000);
	}

	let state: PlayerStateValue;
	playerState.subscribe((s) => (state = s));

	$: {
		if (video && state.jellyfinId) {
			if (!Hls.isSupported()) {
				throw new Error('HLS is not supported');
			}

			if (video.src === '') fetchPlaybackInfo(state.jellyfinId);
		}
	}
</script>

<Modal visible={$playerState.visible} close={handleClose}>
	<div class="bg-black w-screen h-screen relative" on:mousemove={handleMouseMove}>
		<video controls bind:this={video} class="w-full h-full inset-0" />
		<div
			class={classNames('absolute top-4 right-8 transition-opacity', {
				'opacity-0': !uiVisible,
				'opacity-100': uiVisible
			})}
		>
			<IconButton on:click={handleClose}>
				<Cross2 />
			</IconButton>
		</div>
	</div>
</Modal>
