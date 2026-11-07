<script lang="ts">
	import { Selectable } from '$lib/selectable';
	import { PLATFORM_TV, PLATFORM_WEB } from '$lib/constants';
	import { userActivity } from '$lib/stores/user-activity.store';
	import { getVideoZoomLevel } from '$lib/utils';
	import classNames from 'classnames';
	import { Cross1, Play } from 'radix-icons-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Container from '../Container.svelte';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import { topBackground } from '../GlobalBackground/background-stack.store';
	import { createErrorNotification } from '../Notifications/notification.store';
	import Spinner from '../Utils/Spinner.svelte';

	const STOP_WHEN_REMAINING = 0;

	interface Props {
		onPlay?: () => void;
		onPause?: () => void;
		videoId?: string | null;
		loadTime?: any;
		load?: boolean;
		paused?: boolean;
		muted?: boolean;
	}

	let {
		videoId = null,
		loadTime = PLATFORM_TV ? 2500 : 1000,
		load = true,
		paused = false,
		muted = false,
		onPlay,
		onPause
	}: Props = $props();
	const selectable = new Selectable();
	const hasFocus = selectable.hasFocusWithin;

	let userPaused = $state(false);

	const playerId = `youtube-player-${videoId}-${Math.random().toString(36).substr(2, 9)}`;

	// Component did mount
	let didMount = $state(false);
	// Did load script, makes sure we only load the script once
	let isInitialized = $state(false);
	// Player is ready to play, true after initialization and loadTime
	let isPlayerReady = $state(false);
	let player: YT['Player'];
	let checkStopInterval: ReturnType<typeof setInterval>;
	let loadTimeout: ReturnType<typeof setTimeout>;
	let errorTimeout: ReturnType<typeof setTimeout> | undefined = $state(undefined);
	let zoom = $state(
		getVideoZoomLevel({
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight
		})
	);

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
		onPause?.();
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
						// onWatched?.();
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
		onPlay?.();
	}

	function pause() {
		if (!player?.pauseVideo) return;

		player?.pauseVideo?.();
		onPause?.();
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

	// Not dispatched from here: Svelte 5 looks the listeners up through the parent's props when
	// dispatching, and the background stack has dropped the video by the time its outro ends
	onDestroy(() => {
		destroyPlayer();
	});
	// $: {
	// 	const el = document.getElementById(playerId);
	// 	if (el) el.style.opacity = isPlayerReady && visible ? '1' : '0';
	// }
	$effect(() => {
		if (isPlayerReady && load && !paused && !userPaused) play();
	});
	$effect(() => {
		if (isPlayerReady && load && (paused || userPaused)) pause();
	});
	$effect(() => {
		if (isInitialized && isPlayerReady && muted) mute();
	});
	$effect(() => {
		if (isInitialized && isPlayerReady && !muted) unMute();
	});
	$effect(() => {
		if (didMount && !isInitialized && load) loadYouTubeAPI();
	});
</script>

<svelte:window
	onresize={() =>
		(zoom = getVideoZoomLevel({
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight
		}))}
/>

<Container
	{selectable}
	onSelect={() => (userPaused = !userPaused)}
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
		<div id={playerId} class="video-background"></div>
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
			<div out:fade|global>
				<Cross1 class="w-12 h-12" />
			</div>
		{:else if !load || paused || userPaused}
			<Play class="w-12 h-12" />
		{:else if isInitialized && !isPlayerReady}
			<Spinner class="w-12 h-12" />
		{/if}
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div onclick={() => (userPaused = !userPaused)} class="absolute inset-0"></div>
	{#if PLATFORM_WEB}
		<FloatingIconButton
			class={classNames('absolute top-12 right-16 transition-opacity', {
				'opacity-0': !$hasFocus || $userActivity
			})}
			onclick={() => topBackground.destroyVideo()}
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
