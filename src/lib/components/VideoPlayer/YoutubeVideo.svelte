<script lang="ts">
	import { PLATFORM_TV, PLATFORM_WEB } from '$lib/constants';
	import { userActivity } from '$lib/stores/user-activity.store';
	import { getVideoZoomLevel } from '$lib/utils';
	import classNames from 'classnames';
	import { Cross1, Play } from 'radix-icons-svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Container from '../Container.svelte';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import { topBackground } from '../GlobalBackground/BackgroundStack';
	import { createErrorNotification } from '../Notifications/notification.store';
	import Spinner from '../Utils/Spinner.svelte';
	import type { VideoPlayerProps } from './VideoPlayer';

	const STOP_WHEN_REMAINING = 0;

	const dispatch = createEventDispatcher<{
		watched: undefined;
		play: undefined;
		pause: undefined;
	}>();

	export let videoId: string | null = null;
	export let loadTime = PLATFORM_TV ? 2500 : 1000;

	export let load: VideoPlayerProps['load'] = true;
	export let paused: VideoPlayerProps['paused'] = false;
	export let muted: VideoPlayerProps['muted'] = false;
	let hasFocus: Readable<boolean>;

	let userPaused = false;

	const playerId = `youtube-player-${videoId}-${Math.random().toString(36).substr(2, 9)}`;

	// Component did mount
	let didMount = false;
	// Did load script, makes sure we only load the script once
	let isInitialized = false;
	// Player is ready to play, true after initialization and loadTime
	let isPlayerReady = false;
	let player: YT['Player'];
	let checkStopInterval: ReturnType<typeof setInterval>;
	let loadTimeout: ReturnType<typeof setTimeout>;
	let errorTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let zoom = getVideoZoomLevel({
		viewportWidth: window.innerWidth,
		viewportHeight: window.innerHeight
	});

	$: if (isPlayerReady && load && !paused && !userPaused) play();
	$: if (isPlayerReady && load && (paused || userPaused)) pause();
	$: if (isInitialized && isPlayerReady && muted) mute();
	$: if (isInitialized && isPlayerReady && !muted) unMute();

	$: if (didMount && !isInitialized && load) loadYouTubeAPI();
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
		clearTimeout(loadTimeout);
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
					mute: 0
				},
				events: {
					onReady: () => {
						player?.playVideo();
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
						// dispatch('watched');
						// player.pauseVideo();
						// player.seekTo(0);
						topBackground.destroyVideo();
						// player.playVideo();
					} catch (e) {
						console.warn('Error looping video.', e);
					}
				}
			}, 1000);
		} else if (event.data === window.YT.PlayerState.ENDED) {
			topBackground.destroyVideo();
			console.log('Video ended');

			// try {
			// 	player.seekTo(0);
			// 	player.playVideo();
			// } catch (e) {
			// 	console.warn('Error restarting video.', e);
			// }
		}
	}

	function play() {
		if (!player?.playVideo) return;

		player?.playVideo?.();
		dispatch('play');
	}

	function pause() {
		if (!player?.pauseVideo) return;

		player?.pauseVideo?.();
		dispatch('pause');
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
		// if (beginPlay) {
		// 	autoplayTimeout = setTimeout(() => {
		// 		play = true;
		// 		didMount = true;
		// 	}, autoplayDelay);
		// } else {
		didMount = true;
		// }
	});

	onDestroy(() => {
		destroyPlayer();
	});
	// $: {
	// 	const el = document.getElementById(playerId);
	// 	if (el) el.style.opacity = isPlayerReady && visible ? '1' : '0';
	// }
</script>

<svelte:window
	on:resize={() =>
		(zoom = getVideoZoomLevel({
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight
		}))}
/>

<Container
	bind:hasFocusWithin={hasFocus}
	on:select={() => (userPaused = !userPaused)}
	class={classNames('relative h-full w-full transition-opacity bg-black', {
		'opacity-0': !$hasFocus && !isPlayerReady
	})}
>
	<div
		class={classNames(
			'absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity',
			{
				'opacity-0': !isPlayerReady
			}
		)}
		style={`transform: scale(${zoom});`}
	>
		<div id={playerId} class="video-background" />
	</div>

	<div
		class={classNames(
			'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black rounded-full *:p-2 bg-opacity-50',
			{
				'opacity-0': !$hasFocus
			}
		)}
	>
		{#if errorTimeout}
			<div out:fade>
				<Cross1 class="w-12 h-12" />
			</div>
		{:else if !load || paused || userPaused}
			<Play class="w-12 h-12" />
		{:else if isInitialized && !isPlayerReady}
			<Spinner class="w-12 h-12" />
		{/if}
	</div>

	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div on:click={() => (userPaused = !userPaused)} class="absolute inset-0" />
	{#if PLATFORM_WEB}
		<FloatingIconButton
			class={classNames('absolute top-12 right-16 transition-opacity', {
				'opacity-0': !$hasFocus || $userActivity
			})}
			on:click={() => topBackground.destroyVideo()}
		>
			<Cross1 size={32} />
		</FloatingIconButton>
	{/if}
</Container>

<style>
	.video-background {
		width: 100vw;
		height: 150vh;
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
