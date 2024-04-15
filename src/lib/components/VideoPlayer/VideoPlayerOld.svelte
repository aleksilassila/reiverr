<script lang="ts">
	import getDeviceProfile from '../../apis/jellyfin/playback-profiles';
	import { getQualities } from '../../apis/jellyfin/qualities';
	import Hls from 'hls.js';
	import {
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
	import SelectableContextMenuItem from '../ContextMenu/SelectableContextMenuItem.svelte';
	import IconButton from '../IconButton.svelte';
	import Slider from './Slider.svelte';
	import { linear } from 'svelte/easing';
	import ContextMenuButton from '../ContextMenu/ContextMenuButton.svelte';
	import { isTizen } from '../../utils/browser-detection';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api.js';
	import { videoPlayerSettings } from '../../stores/localstorage.store';
	import { get } from 'svelte/store';
	import { appState } from '../../stores/app-state.store';
	import { getBrowserSpecificMediaFunctions } from './VideoPlayer';

	export let jellyfinId: string;

	let qualityContextMenuId = Symbol();

	let video: HTMLVideoElement;
	let videoWrapper: HTMLDivElement;
	let mouseMovementTimeout: ReturnType<typeof setTimeout>;
	let stopCallback: () => void;
	let deleteEncoding: () => void;
	let reportProgress: () => void;
	let progressInterval: ReturnType<typeof setTimeout>;

	const { reqFullscreenFunc, exitFullscreen, fullscreenChangeEvent, getFullscreenElement } =
		getBrowserSpecificMediaFunctions();

	const inintialValues = get(videoPlayerSettings);

	let paused: boolean = false;
	let duration: number = 0;
	let displayedTime: number = 0;
	let bufferedTime: number = 0;

	let videoLoaded: boolean = false;
	let seeking: boolean = false;
	let playerStateBeforeSeek: boolean;

	let fullscreen: boolean = false;
	let volume: number = inintialValues.volume;
	let mute: boolean = inintialValues.muted;

	let resolution: number = 1080;
	let currentBitrate: number = 0;

	let shouldCloseUi = false;
	let uiVisible = true;
	$: uiVisible = !shouldCloseUi || seeking || paused || $contextMenu === qualityContextMenuId;

	$: videoPlayerSettings.set({ volume, muted: mute });

	const fetchPlaybackInfo = (
		itemId: string,
		maxBitrate: number | undefined = undefined,
		starting: boolean = true
	) =>
		jellyfinApi.getLibraryItem(itemId).then((item) =>
			jellyfinApi
				.getPlaybackInfo(
					itemId,
					getDeviceProfile(),
					item?.UserData?.PlaybackPositionTicks || Math.floor(displayedTime * 10_000_000),
					maxBitrate || getQualities(item?.Height || 1080)[0]?.maxBitrate
				)
				.then(async (playbackInfo) => {
					if (!playbackInfo) return;
					const { playbackUri, playSessionId: sessionId, mediaSourceId, directPlay } = playbackInfo;

					if (!playbackUri || !sessionId) {
						console.log('No playback URL or session ID', playbackUri, sessionId);
						return;
					}

					video.poster = item?.BackdropImageTags?.length
						? `${$appState.user?.settings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Backdrop?quality=100&tag=${item?.BackdropImageTags?.[0]}`
						: '';

					videoLoaded = false;
					if (!directPlay) {
						if (Hls.isSupported()) {
							const hls = new Hls();

							hls.loadSource($appState.user?.settings.jellyfin.baseUrl + playbackUri);
							hls.attachMedia(video);
						} else if (video.canPlayType('application/vnd.apple.mpegurl') || isTizen()) {
							/*
							 * HLS.js does NOT work on iOS on iPhone because Safari on iPhone does not support MSE.
							 * This is not a problem, since HLS is natively supported on iOS. But any other browser
							 * that does not support MSE will not be able to play the video.
							 */
							video.src = $appState.user?.settings.jellyfin.baseUrl + playbackUri;
						} else {
							throw new Error('HLS is not supported');
						}
					} else {
						video.src = $appState.user?.settings.jellyfin.baseUrl + playbackUri;
					}

					resolution = item?.Height || 1080;
					currentBitrate = maxBitrate || getQualities(resolution)[0]?.maxBitrate;

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
						await jellyfinApi.reportPlaybackStarted(itemId, sessionId, mediaSourceId);

					reportProgress = async () => {
						await jellyfinApi.reportPlaybackProgress(
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
						jellyfinApi.deleteActiveEncoding(sessionId);
					};

					stopCallback = () => {
						jellyfinApi.reportPlaybackStopped(itemId, sessionId, video?.currentTime * 10_000_000);
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

	// function handleClose() {
	// 	playerState.close();
	// 	video?.pause();
	// 	clearInterval(progressInterval);
	// 	stopCallback?.();
	// 	modalStack.close(modalId);
	// }

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

	async function handleSelectQuality(bitrate: number) {
		if (!jellyfinId || !video || seeking) return;
		if (bitrate === currentBitrate) return;

		currentBitrate = bitrate;
		video.pause();
		let timeBeforeLoad = video.currentTime;
		let stateBeforeLoad = paused;
		await reportProgress?.();
		await deleteEncoding?.();
		await fetchPlaybackInfo?.(jellyfinId, bitrate, false);
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

	$: {
		if (video && jellyfinId) {
			if (video.src === '') fetchPlaybackInfo(jellyfinId);
			// video.play();
		}
	}

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
		} else if (event.key === ' ' || event.key === 'k') {
			paused = !paused;
		} else if (event.key === 'ArrowLeft') {
			video.currentTime -= 10;
		} else if (event.key === 'ArrowRight') {
			video.currentTime += 10;
		} else if (event.key === 'ArrowUp') {
			volume = Math.min(volume + 0.1, 1);
		} else if (event.key === 'ArrowDown') {
			volume = Math.max(volume - 0.1, 0);
		} else if (event.key === 'm') {
			mute = !mute;
		}
	}

	onMount(() => {
		// Workaround because the paused state does not sync
		// with the video element until a change is made
		// paused = false;
		// if (video && $playerState.jellyfinId) {
		// 	if (video.src === '') fetchPlaybackInfo($playerState.jellyfinId);
		// }
	});

	onDestroy(() => {
		clearInterval(progressInterval);
		if (fullscreen) exitFullscreen?.();
	});
</script>

<svelte:window on:keydown={handleShortcuts} />

<div
	class="w-full h-full flex items-center justify-center relative"
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
		autoplay
	/>

	{#if uiVisible}
		<!-- Video controls -->
		<div
			class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/[.8] via-60% via-black-opacity-80 to-transparent"
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

<!--{#if uiVisible}-->
<!--	<div class="absolute top-4 right-8 z-50" transition:fade={{ duration: 100 }}>-->
<!--		<IconButton on:click={handleClose}>-->
<!--			<Cross2 size={25} />-->
<!--		</IconButton>-->
<!--	</div>-->
<!--{/if}-->
<!--</div>-->
