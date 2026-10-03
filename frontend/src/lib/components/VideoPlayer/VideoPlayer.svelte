<script lang="ts">
	import classNames from 'classnames';
	import { EnterFullScreen, Pause, TextAlignLeft, Video } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import { useRegistrar } from '../../selectable';
	import Container from '../Container.svelte';
	import IconButton from '../IconButton.svelte';
	import Spinner from '../Utils/Spinner.svelte';
	import ProgressBar from './ProgressBar.svelte';

	import { get } from 'svelte/store';
	import { useSimpleModal as useSimpleModalStack } from '../Modal/modal.store';
	import ModalStackProvider from '../Modal/ModalStackProvider.svelte';
	import SelectSubtitlesModal from './SelectSubtitlesModal.svelte';
	import SelectVideoModal from './SelectVideoModal.svelte';
	import VideoElement from './VideoElement.svelte';
	import { videoPlayerContext, type SubtitleTrack, type VideoTrack } from './video-player.store';
	import { isTv } from '$lib/utils/browser-detection';

	export let title: string;
	export let subtitle: string = '';
	export let videoTracks: VideoTrack[];
	export let subtitleTracks: SubtitleTrack[] = [];
	/** From 0 to 1 */
	export let progress = 0;
	export let onProgress: (progress: number) => void = () => {};

	export let modalHidden = false;

	const {
		videoTracks: videoTrackState,
		subtitleTracks: subtitleTrackState,
		paused,
		duration,
		currentTime,
		bufferedTime,
		buffering,
		videoDidLoad,
		seeking,
		error,
		togglePause,
		play,
		pause: pauseVideo,
		seekAndPlay,
		selectVideoTrack,
		selectSubtitles,
		toggleFullscreen,
		handleKeyboardShortcut
	} = videoPlayerContext.createContext({
		videoTracks,
		subtitleTracks,
		initialProgress: progress,
		onProgress
	});

	const modalStack = useSimpleModalStack();

	let showInterface = true;
	let showInterfaceTimeout: ReturnType<typeof setTimeout>;
	let hideInterfaceTimeout: ReturnType<typeof setTimeout>;
	let progressBar = useRegistrar();

	let clockTime = 0;
	let clockInterval = setInterval(() => {
		clockTime = Date.now();
	}, 1000);

	$: if (modalHidden) pauseVideo();
	else play();
	$: if (!$seeking && !modalHidden) handleShowInterface();
	$: if ($paused) handleShowInterface();

	function handleShowInterface() {
		showInterface = true;
		clearTimeout(showInterfaceTimeout);
		showInterfaceTimeout = setTimeout(() => {
			if (!$seeking && !modalHidden) handleHideInterface();
		}, 5000);
	}

	function handleHideInterface() {
		showInterface = false;
		clearTimeout(hideInterfaceTimeout);
		hideInterfaceTimeout = setTimeout(() => {
			get(progressBar)?.activate();
		}, 200);
	}

	onDestroy(() => {
		clearTimeout(showInterfaceTimeout);
		clearTimeout(hideInterfaceTimeout);
		clearInterval(clockInterval);
	});
</script>

<Container />
<Container
	class="w-full h-full relative bg-black"
	on:mousemove={handleShowInterface}
	on:navigate={({ detail }) => {
		if (!showInterface && detail.direction !== 'down') {
			detail.stopPropagation();
			detail.preventNavigation();
		}
		handleShowInterface();
	}}
	on:back={({ detail }) => {
		if (document.fullscreenElement) {
			detail.stopPropagation();
			return;
		}
	}}
	on:click={() => togglePause?.()}
	let:hasFocusWithin
>
	<VideoElement />

	<!-- Overlay secondary-950/75 -->
	<div
		class={classNames(
			'absolute inset-0 transition-opacity pointer-events-none',
			'bg-gradient-to-b from-secondary-950/75 from-0% to-[150px] to-transparent',
			{
				'opacity-0': !showInterface || !hasFocusWithin
			}
		)}
	/>
	<div
		class={classNames(
			'absolute inset-0 transition-opacity pointer-events-none',
			'bg-gradient-to-t from-secondary-950/75 from-0% to-[300px] to-transparent',
			{
				'opacity-0': !showInterface || !hasFocusWithin
			}
		)}
	/>
	<!-- <Container
		class={classNames('absolute inset-x-12 top-8 transition-opacity', {
			'opacity-0': !showInterface || !hasFocusWithin
		})}
	>
	</Container> -->

	{#if $error}
		<div class="absolute inset-0 flex items-center justify-center px-32 text-center">
			<div class="text-2xl font-medium text-secondary-200 bg-black/50 rounded-xl px-8 py-6">
				{$error}
			</div>
		</div>
	{:else if $paused && showInterface && !$seeking}
		<div
			class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
		>
			<Pause class="w-12 h-12" />
		</div>
	{:else if ($buffering && !$paused) || !$videoDidLoad}
		<div
			class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
		>
			<Spinner class="w-12 h-12" />
		</div>
	{/if}
	<Container
		class={classNames(
			'absolute inset-x-12 inset-y-8 transition-opacity flex flex-col justify-between',
			{
				'opacity-0': !showInterface || !hasFocusWithin
			}
		)}
	>
		<div
			class="flex justify-between items-center text-secondary-300 font-medium text-wider text-xl tracking-wide"
		>
			<div></div>
			<div>
				Ends at {new Date(
					clockTime + (($duration ?? 0) - ($currentTime ?? 0)) * 1000
				).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
			</div>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click={(e) => e.stopPropagation()}>
			<Container
				direction="horizontal"
				on:navigate={({ detail }) => {
					if (detail.direction === 'up' && detail.willLeaveContainer) {
						detail.stopPropagation();
						detail.preventNavigation();
						handleHideInterface();
					}
				}}
				class="flex justify-between px-2 py-4 items-end"
			>
				<div>
					<div class="text-secondary-300 font-medium text-wider text-xl mb-1 tracking-wide">
						{subtitle}
					</div>
					<h1 class="h1">{title}</h1>
				</div>
				<div class="flex space-x-2">
					{#if $subtitleTrackState.tracks.length}
						<IconButton
							on:clickOrSelect={() => {
								modalStack.createModal(SelectSubtitlesModal, {
									available: $subtitleTrackState.tracks,
									current: $subtitleTrackState.current,
									selectSubtitles
								});
							}}
						>
							<TextAlignLeft size={24} />
						</IconButton>
					{/if}
					{#if $videoTrackState.tracks.length > 1}
						<IconButton
							on:clickOrSelect={() => {
								modalStack.createModal(SelectVideoModal, {
									available: $videoTrackState.tracks,
									current: $videoTrackState.current,
									selectVideoTrack
								});
							}}
						>
							<Video size={24} />
						</IconButton>
					{/if}
					{#if !isTv()}
						<IconButton on:clickOrSelect={() => toggleFullscreen()}>
							<EnterFullScreen size={24} />
						</IconButton>
					{/if}
				</div>
			</Container>
			<ProgressBar
				bind:seeking={$seeking}
				on:jumpTo={(e) => seekAndPlay(e.detail)}
				on:play={() => play()}
				on:pause={() => pauseVideo()}
				duration={$duration}
				currentTime={$currentTime}
				bufferedTime={$bufferedTime}
				bind:paused={$paused}
				on:mount={progressBar.registrar}
			/>
		</div>
	</Container>
</Container>

<svelte:window on:keypress={(e) => handleKeyboardShortcut?.(e)} />

<ModalStackProvider {modalStack} />
