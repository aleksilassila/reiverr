<script lang="ts">
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
	import classNames from 'classnames';
	import Hls from 'hls.js';
	import {
		Cross2,
		EnterFullScreen,
		ExitFullScreen,
		Gear,
		Pause,
		Play,
		SpeakerLoud,
		SpeakerModerate,
		SpeakerOff,
		SpeakerQuiet
	} from 'radix-icons-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { contextMenu } from '../ContextMenu/ContextMenu';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import SelectableContextMenuItem from '../ContextMenu/SelectableContextMenuItem.svelte';
	import IconButton from '../IconButton.svelte';
	import { modalStack } from '../../stores/modal.store';
	import Slider from './Slider.svelte';
	import { playerState } from './VideoPlayer';
	import { linear } from 'svelte/easing';
	import ContextMenuButton from '../ContextMenu/ContextMenuButton.svelte';

	export let modalId: symbol;

	let qualityContextMenuId = Symbol();

	let video: HTMLVideoElement;
	let videoWrapper: HTMLDivElement;
	let mouseMovementTimeout: NodeJS.Timeout;
	let stopCallback: () => void;
	let deleteEncoding: () => void;
	let reportProgress: () => void;
	let progressInterval: NodeJS.Timeout;

	// These functions are different in every browser
	let reqFullscreenFunc: ((elem: HTMLElement) => void) | undefined = undefined;
	let exitFullscreen: (() => void) | undefined = undefined;
	let fullscreenChangeEvent: string | undefined = undefined;
	let getFullscreenElement: (() => HTMLElement) | undefined = undefined;

	// Find the correct functions
	let elem = document.createElement('div');
	// @ts-ignore
	if (elem.requestFullscreen) {
		reqFullscreenFunc = (elem) => {
			elem.requestFullscreen();
		};
		fullscreenChangeEvent = 'fullscreenchange';
		getFullscreenElement = () => <HTMLElement>document.fullscreenElement;
		if (document.exitFullscreen) exitFullscreen = () => document.exitFullscreen();
		// @ts-ignore
	} else if (elem.webkitRequestFullscreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-ignore
			elem.webkitRequestFullscreen();
		};
		fullscreenChangeEvent = 'webkitfullscreenchange';
		// @ts-ignore
		getFullscreenElement = () => <HTMLElement>document.webkitFullscreenElement;
		// @ts-ignore
		if (document.webkitExitFullscreen) exitFullscreen = () => document.webkitExitFullscreen();
		// @ts-ignore
	} else if (elem.msRequestFullscreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-ignore
			elem.msRequestFullscreen();
		};
		fullscreenChangeEvent = 'MSFullscreenChange';
		// @ts-ignore
		getFullscreenElement = () => <HTMLElement>document.msFullscreenElement;
		// @ts-ignore
		if (document.msExitFullscreen) exitFullscreen = () => document.msExitFullscreen();
		// @ts-ignore
	} else if (elem.mozRequestFullScreen) {
		reqFullscreenFunc = (elem) => {
			// @ts-ignore
			elem.mozRequestFullScreen();
		};
		fullscreenChangeEvent = 'mozfullscreenchange';
		// @ts-ignore
		getFullscreenElement = () => <HTMLElement>document.mozFullScreenElement;
		// @ts-ignore
		if (document.mozCancelFullScreen) exitFullscreen = () => document.mozCancelFullScreen();
	}

	let paused: boolean;
	let duration: number = 0;
	let displayedTime: number = 0;
	let bufferedTime: number = 0;

	let videoLoaded: boolean = false;
	let seeking: boolean = false;
	let playerStateBeforeSeek: boolean;

	let fullscreen: boolean = false;
	let volume: number = 1;
	let mute: boolean = false;

	let resolution: number = 1080;
	let currentBitrate: number = 0;

	let shouldCloseUi = false;
	let uiVisible = true;
	$: uiVisible = !shouldCloseUi || seeking || paused || $contextMenu === qualityContextMenuId;

	const fetchPlaybackInfo = (
		itemId: string,
		maxBitrate: number | undefined = undefined,
		starting: boolean = true
	) =>
		getJellyfinItem(itemId).then((item) =>
			getJellyfinPlaybackInfo(
				itemId,
				getDeviceProfile(),
				item?.UserData?.PlaybackPositionTicks || Math.floor(displayedTime * 10_000_000),
				maxBitrate || getQualities(item?.Height || 1080)[0].maxBitrate
			).then(async (playbackInfo) => {
				if (!playbackInfo) return;
				const { playbackUri, playSessionId: sessionId, mediaSourceId, directPlay } = playbackInfo;

				if (!playbackUri || !sessionId) {
					console.log('No playback URL or session ID', playbackUri, sessionId);
					return;
				}

				video.poster = item?.BackdropImageTags?.length
					? `${$settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
					: '';

				videoLoaded = false;
				if (!directPlay) {
					if (Hls.isSupported()) {
						const hls = new Hls();

						hls.loadSource($settings.jellyfin.baseUrl + playbackUri);
						hls.attachMedia(video);
					} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
						/*
						 * HLS.js does NOT work on iOS on iPhone because Safari on iPhone does not support MSE.
						 * This is not a problem, since HLS is natively supported on iOS. But any other browser
						 * that does not support MSE will not be able to play the video.
						 */
						video.src = $settings.jellyfin.baseUrl + playbackUri;
					} else {
						throw new Error('HLS is not supported');
					}
				} else {
					video.src = $settings.jellyfin.baseUrl + playbackUri;
				}

				resolution = item?.Height || 1080;
				currentBitrate = maxBitrate || getQualities(resolution)[0].maxBitrate;

				if (item?.UserData?.PlaybackPositionTicks) {
					displayedTime = item?.UserData?.PlaybackPositionTicks / 10_000_000;
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
						video?.paused == true,
						video?.currentTime * 10_000_000
					);
				};

				if (progressInterval) clearInterval(progressInterval);
				progressInterval = setInterval(() => {
					video && video.readyState === 4 && video?.currentTime > 0 && sessionId && itemId;
					reportProgress();
				}, 5000);

				deleteEncoding = () => {
					deleteActiveEncoding(sessionId);
				};

				stopCallback = () => {
					reportJellyfinPlaybackStopped(itemId, sessionId, video?.currentTime * 10_000_000);
					deleteEncoding();
				};
			})
		);

	function onSeekStart() {
		if (seeking) return;

		playerStateBeforeSeek = paused;
		seeking = true;
		paused = true;
	}

	function onSeekEnd() {
		if (!seeking) return;

		paused = playerStateBeforeSeek;
		seeking = false;

		video.currentTime = displayedTime;
	}

	function handleBuffer() {
		let timeRanges = video.buffered;
		// Find the first one whose end time is after the current time
		// (the time ranges given by the browser are normalized, which means
		// that they are sorted and non-overlapping)
		for (let i = 0; i < timeRanges.length; i++) {
			if (timeRanges.end(i) > video.currentTime) {
				bufferedTime = timeRanges.end(i);
				break;
			}
		}
	}

	function handleClose() {
		playerState.close();
		video?.pause();
		clearInterval(progressInterval);
		stopCallback?.();
		modalStack.close(modalId);
	}

	function handleUserInteraction(touch: boolean = false) {
		if (touch) shouldCloseUi = !shouldCloseUi;
		else shouldCloseUi = false;

		if (!shouldCloseUi) {
			if (mouseMovementTimeout) clearTimeout(mouseMovementTimeout);
			mouseMovementTimeout = setTimeout(() => {
				shouldCloseUi = true;
			}, 3000);
		} else {
			if (mouseMovementTimeout) clearTimeout(mouseMovementTimeout);
		}
	}

	function handleQualityToggleVisibility() {
		if ($contextMenu === qualityContextMenuId) contextMenu.hide();
		else contextMenu.show(qualityContextMenuId);
	}

	async function handleSelectQuality(bitrate: number) {
		if (!$playerState.jellyfinId || !video || seeking) return;
		if (bitrate === currentBitrate) return;

		currentBitrate = bitrate;
		video.pause();
		let timeBeforeLoad = video.currentTime;
		let stateBeforeLoad = paused;
		await reportProgress?.();
		await deleteEncoding?.();
		await fetchPlaybackInfo?.($playerState.jellyfinId, bitrate, false);
		displayedTime = timeBeforeLoad;
		paused = stateBeforeLoad;
	}

	function secondsToTime(seconds: number, forceHours = false) {
		if (isNaN(seconds)) return '00:00';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds - hours * 3600) / 60);
		const secondsLeft = Math.floor(seconds - hours * 3600 - minutes * 60);

		let str = '';
		if (hours > 0 || forceHours) str += `${hours}:`;

		if (minutes >= 10) str += `${minutes}:`;
		else str += `0${minutes}:`;

		if (secondsLeft >= 10) str += `${secondsLeft}`;
		else str += `0${secondsLeft}`;

		return str;
	}

	onMount(() => {
		// Workaround because the paused state does not sync
		// with the video element until a change is made
		paused = false;

		if (video && $playerState.jellyfinId) {
			if (video.src === '') fetchPlaybackInfo($playerState.jellyfinId);
		}
	});

	onDestroy(() => {
		clearInterval(progressInterval);
		if (fullscreen) exitFullscreen?.();
	});

	$: {
		if (fullscreen && !getFullscreenElement?.()) {
			if (reqFullscreenFunc) reqFullscreenFunc(videoWrapper);
		} else if (getFullscreenElement?.()) {
			if (exitFullscreen) exitFullscreen();
		}
	}

	// We add a listener to the fullscreen change event to update the fullscreen variable
	// since it can be changed by the user by other means than the button
	if (fullscreenChangeEvent) {
		document.addEventListener(fullscreenChangeEvent, () => {
			fullscreen = !!getFullscreenElement?.();
		});
	}

	function handleRequestFullscreen() {
		if (reqFullscreenFunc) {
			fullscreen = !fullscreen;
			// @ts-ignore
		} else if (video?.webkitEnterFullScreen) {
			// Edge case to allow fullscreen on iPhone
			// @ts-ignore
			video.webkitEnterFullScreen();
		}
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'f') {
			handleRequestFullscreen();
		} else if (event.key === ' ') {
			paused = !paused;
		} else if (event.key === 'ArrowLeft') {
			video.currentTime -= 10;
		} else if (event.key === 'ArrowRight') {
			video.currentTime += 10;
		} else if (event.key === 'ArrowUp') {
			volume = Math.min(volume + 0.1, 1);
		} else if (event.key === 'ArrowDown') {
			volume = Math.max(volume - 0.1, 0);
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class={classNames(
		'bg-black w-screen h-[100dvh] sm:h-screen relative flex items-center justify-center',
		{
			'cursor-none': !uiVisible
		}
	)}
	in:fade|global={{ duration: 300, easing: linear }}
	out:fade|global={{ duration: 200, easing: linear }}
>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="w-screen h-screen flex items-center justify-center"
		bind:this={videoWrapper}
		on:mousemove={() => handleUserInteraction(false)}
		on:touchend|preventDefault={() => handleUserInteraction(true)}
		in:fade|global={{ duration: 500, delay: 1200, easing: linear }}
	>
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			bind:this={video}
			bind:paused
			bind:duration
			on:timeupdate={() =>
				(displayedTime = !seeking && videoLoaded ? video.currentTime : displayedTime)}
			on:progress={() => handleBuffer()}
			on:play={() => {
				if (seeking) video?.pause();
			}}
			on:loadeddata={() => {
				video.currentTime = displayedTime;
				videoLoaded = true;
			}}
			bind:volume
			bind:muted={mute}
			class="sm:w-full sm:h-full"
			playsinline={true}
			on:dblclick|preventDefault={() => (fullscreen = !fullscreen)}
			on:click={() => (paused = !paused)}
		/>

		{#if uiVisible}
			<!-- Video controls -->
			<div
				class="absolute bottom-0 w-screen bg-gradient-to-t from-black/[.8] via-60% via-black-opacity-80 to-transparent"
				on:touchend|stopPropagation
				transition:fade={{ duration: 100 }}
			>
				<div class="flex flex-col items-center p-4 gap-2 w-full">
					<div class="flex items-center text-sm w-full">
						<span class="whitespace-nowrap tabular-nums"
							>{secondsToTime(displayedTime, duration > 3600)}</span
						>
						<div class="flex-grow">
							<Slider
								bind:primaryValue={displayedTime}
								secondaryValue={bufferedTime}
								max={duration}
								on:mousedown={onSeekStart}
								on:mouseup={onSeekEnd}
								on:touchstart={onSeekStart}
								on:touchend={onSeekEnd}
							/>
						</div>
						<span class="whitespace-nowrap tabular-nums">{secondsToTime(duration)}</span>
					</div>

					<div class="flex items-center justify-between mb-2 w-full">
						<IconButton on:click={() => (paused = !paused)}>
							{#if (!seeking && paused) || (seeking && playerStateBeforeSeek)}
								<Play size={20} />
							{:else}
								<Pause size={20} />
							{/if}
						</IconButton>

						<div class="flex items-center space-x-3">
							<ContextMenuButton heading="Quality">
								<svelte:fragment slot="menu">
									{#each getQualities(resolution) as quality}
										<SelectableContextMenuItem
											selected={quality.maxBitrate === currentBitrate}
											on:click={() => handleSelectQuality(quality.maxBitrate)}
										>
											{quality.name}
										</SelectableContextMenuItem>
									{/each}
								</svelte:fragment>

								<IconButton>
									<Gear size={20} />
								</IconButton>
							</ContextMenuButton>
							<IconButton
								on:click={() => {
									mute = !mute;
								}}
							>
								{#if volume == 0 || mute}
									<SpeakerOff size={20} />
								{:else if volume < 0.25}
									<SpeakerQuiet size={20} />
								{:else if volume < 0.9}
									<SpeakerModerate size={20} />
								{:else}
									<SpeakerLoud size={20} />
								{/if}
							</IconButton>

							<div class="w-32">
								<Slider bind:primaryValue={volume} secondaryValue={0} max={1} />
							</div>

							<IconButton on:click={handleRequestFullscreen}>
								{#if fullscreen}
									<ExitFullScreen size={20} />
								{:else if !fullscreen && exitFullscreen}
									<EnterFullScreen size={20} />
								{/if}
							</IconButton>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if uiVisible}
		<div class="absolute top-4 right-8 z-50" transition:fade={{ duration: 100 }}>
			<IconButton on:click={handleClose}>
				<Cross2 size={25} />
			</IconButton>
		</div>
	{/if}
</div>
