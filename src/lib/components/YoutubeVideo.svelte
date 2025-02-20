<script lang="ts">
	import { PLATFORM_TV } from '$lib/constants';
	import { Cross1 } from 'radix-icons-svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { createErrorNotification } from './Notifications/notification.store';
	import Spinner from './Utils/Spinner.svelte';

	const STOP_WHEN_REMAINING = 12;

	const dispatch = createEventDispatcher<{
		watched: undefined;
		play: undefined;
		pause: undefined;
	}>();

	export let videoId: string | null = null;
	// Load video only if visible, pause with delay when not visible
	export let visible = true;
	// Play/pause video
	export let play = true;
	// Autoplay after load
	export let muted = false;
	export let autoplay = true;
	export let autoplayDelay = 2000;
	export let loadTime = PLATFORM_TV ? 2500 : 1000;

	const playerId = `youtube-player-${videoId}-${Math.random().toString(36).substr(2, 9)}`;

	// Component did mount
	let didMount = false;
	// Did load script, makes sure we only load the script once
	let isInitialized = false;
	// Player is ready to play, true after initialization and loadTime
	let isPlayerReady = false;
	let player: YT['Player'];
	let checkStopInterval: ReturnType<typeof setInterval>;
	let autoplayTimeout: ReturnType<typeof setTimeout>;
	let loadTimeout: ReturnType<typeof setTimeout>;
	let pauseTimeout: ReturnType<typeof setTimeout>;
	let errorTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	$: if (isPlayerReady && player?.playVideo && visible && play) {
		clearTimeout(pauseTimeout);
		player.playVideo();
		dispatch('play');
	} else if (isPlayerReady && player?.pauseVideo && !play) {
		// Pause immediately when unpaused
		player.pauseVideo();
		dispatch('pause');
	} else if (isPlayerReady && player?.pauseVideo && !visible) {
		// Pause with delay when not visible
		pauseTimeout = setTimeout(() => {
			player.pauseVideo();
			dispatch('pause');
		}, 1000);
	}

	$: if (isInitialized && isPlayerReady && muted) mute();
	$: if (isInitialized && isPlayerReady && !muted) unMute();

	$: if (didMount && !isInitialized && visible && play) loadYouTubeAPI();
	function loadYouTubeAPI() {
		isInitialized = true;
		console.log('Loading YouTube API for ' + videoId);
		if (!window.YT) {
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(tag);
			(window as any).onYouTubeIframeAPIReady = () => {
				setupPlayer();
			};
		} else {
			setupPlayer();
		}
	}

	function destroyPlayer() {
		console.log('Destroying player');

		clearInterval(checkStopInterval);
		clearTimeout(autoplayTimeout);
		clearTimeout(loadTimeout);
		clearTimeout(pauseTimeout);
		didMount = false;
		isInitialized = false;
		isPlayerReady = false;

		if (!player) return;

		try {
			player.destroy();
		} catch (e) {
			console.warn('Error destroying player.', e);
		}

		dispatch('pause');
	}

	function setupPlayer() {
		if (!window.YT || !videoId) return;

		setTimeout(() => {
			if (!window.YT) return;

			player = new window.YT.Player(playerId, {
				videoId: videoId,
				playerVars: {
					autoplay: 0,
					controls: 0,
					modestbranding: 1,
					rel: 0,
					iv_load_policy: 3,
					start: 3,
					fs: 0,
					disablekb: 1,
					cc_load_policy: 0,
					mute: 1
				},
				events: {
					onReady: () => {
						player?.playVideo();
						play = true;
						if (loadTime) {
							loadTimeout = setTimeout(() => {
								isPlayerReady = true;
								console.log('Playing video');
							}, loadTime);
						} else {
							isPlayerReady = true;
							console.log('Playing video');
						}
					},
					onStateChange: handlePlayerStateChange,
					onError: handlePlayerError
				}
			});
		}, 200);
	}

	function handlePlayerError(event: any) {
		const errorMessages: Record<number, string> = {
			2: 'Invalid video ID.',
			5: 'Playback error.',
			100: 'Video not found.',
			101: 'Embedding restricted by the owner.',
			150: 'Embedding restricted by the owner.'
		};

		errorTimeout = setTimeout(() => {
			errorTimeout = undefined;
		}, 1000);

		console.error('YouTube Player Error:', errorMessages[event.data] || 'Unknown error.');
		createErrorNotification(
			'Could not play trailer',
			errorMessages[event.data] || 'Unknown error.'
		);
		destroyPlayer();
	}

	function handlePlayerStateChange(event: any) {
		if (!isPlayerReady) return;

		if (event.data === window.YT.PlayerState.PLAYING) {
			// setTimeout(() => (showBackgroundImage = false), 1000);

			clearInterval(checkStopInterval);

			checkStopInterval = setInterval(() => {
				if (
					!player
					// showBackgroundImageError ||
				) {
					clearInterval(checkStopInterval);
					return;
				}

				const remainingTime = player.getDuration() - player.getCurrentTime();

				if (remainingTime <= STOP_WHEN_REMAINING) {
					try {
						dispatch('watched');
						player.pauseVideo();
						player.seekTo(0);
						// player.playVideo();
					} catch (e) {
						console.warn('Error looping video.', e);
					}
				}
			}, 1000);
		} else if (event.data === window.YT.PlayerState.ENDED) {
			try {
				player.seekTo(0);
				player.playVideo();
			} catch (e) {
				console.warn('Error restarting video.', e);
			}
		}
	}

	function mute() {
		if (!player) return;

		console.log('Muting video');

		player?.setVolume?.(0);
	}

	function unMute() {
		if (!player) return;

		console.log('Unmuting video');

		// @ts-expect-error
		if (PLATFORM_TV || navigator?.getAutoplayPolicy?.('mediaelement') === 'allowed') {
			player?.unMute?.();
		}

		player?.setVolume?.(100);
	}

	onMount(() => {
		if (autoplay) {
			autoplayTimeout = setTimeout(() => {
				play = true;
				didMount = true;
			}, autoplayDelay);
		} else {
			didMount = true;
		}
	});

	onDestroy(() => {
		destroyPlayer();
	});
	$: {
		const el = document.getElementById(playerId);
		if (el) el.style.opacity = isPlayerReady && visible ? '1' : '0';
	}
</script>

{#if errorTimeout}
	<div
		class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
		out:fade
	>
		<Cross1 class="w-12 h-12" />
	</div>
{:else if isInitialized && !isPlayerReady}
	<div
		class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
	>
		<Spinner class="w-12 h-12" />
	</div>
{/if}

<div out:fade={isPlayerReady && visible ? { delay: 1000 } : { duration: 0, delay: 0 }}>
	<div id={playerId} class="video-background" style="opacity: 0;" />
</div>

<style>
	.video-background {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100vw;
		height: 100vh;
		transform: translate(-50%, -50%) scale(1.6);
		transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
		z-index: 0;
	}

	@media (max-width: 1200px) {
		.video-background {
			transform: translate(-50%, -50%) scale(2);
		}
	}

	@media (max-width: 800px) {
		.video-background {
			transform: translate(-50%, -50%) scale(2.5);
		}
	}

	@media (max-width: 500px) {
		.video-background {
			transform: translate(-50%, -50%) scale(3);
		}
	}

	.background-image {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 1;
		background-size: cover;
		background-position: center;
		opacity: 1;
	}
</style>
