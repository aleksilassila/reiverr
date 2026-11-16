<script lang="ts">
	import classNames from 'classnames';
	import {
		ChatBubble,
		EnterFullScreen,
		ExitFullScreen,
		Pause,
		TextAlignLeft,
		Video
	} from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import { Selectable } from '../../selectable';
	import Container from '../Container.svelte';
	import IconButton from '../IconButton.svelte';
	import Spinner from '../Utils/Spinner.svelte';
	import ProgressBar from './ProgressBar.svelte';

	import { useSimpleModal as useSimpleModalStack } from '../Modal/modal.store';
	import ModalStackProvider from '../Modal/ModalStackProvider.svelte';
	import SelectAudioModal from './SelectAudioModal.svelte';
	import SelectSubtitlesModal from './SelectSubtitlesModal.svelte';
	import SelectVideoModal from './SelectVideoModal.svelte';
	import VideoElement from './VideoElement.svelte';
	import VolumeControl from './VolumeControl.svelte';
	import { videoPlayerContext, type VideoPlayerMedia } from './video-player.store';
	import { isTv } from '$lib/utils/browser-detection';
	import { PLATFORM_WEB } from '$lib/constants';

	type Props = VideoPlayerMedia & {
		modalHidden?: boolean;
	};

	let {
		title,
		titlePrefix,
		subtitle = '',
		videoTracks,
		subtitleTracks = [],
		progress = 0,
		onProgress = () => {},
		modalHidden = false
	}: Props = $props();

	const {
		playerElement,
		videoTracks: videoTrackState,
		subtitleTracks: subtitleTrackState,
		audioTracks: audioTrackState,
		paused,
		duration,
		currentTime,
		bufferedTime,
		buffering,
		videoDidLoad,
		seeking,
		error,
		audibleVolume,
		togglePause,
		play,
		pause: pauseVideo,
		seekAndPlay,
		selectVideoTrack,
		selectSubtitles,
		selectAudioTrack,
		toggleFullscreen,
		setVolume,
		toggleMute,
		handleKeyboardShortcut
	} = videoPlayerContext.createContext({
		videoTracks,
		subtitleTracks,
		initialProgress: progress,
		onProgress
	});

	const modalStack = useSimpleModalStack();

	let showInterface = $state(true);
	let isFullscreen = $state(false);
	let showInterfaceTimeout: ReturnType<typeof setTimeout>;
	let hideInterfaceTimeout: ReturnType<typeof setTimeout>;
	const progressBar = new Selectable();

	let clockTime = $state(0);
	const clockInterval = setInterval(() => {
		clockTime = Date.now();
	}, 1000);

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
			progressBar.activate();
		}, 200);
	}

	onDestroy(() => {
		clearTimeout(showInterfaceTimeout);
		clearTimeout(hideInterfaceTimeout);
		clearInterval(clockInterval);
	});
	$effect(() => {
		if (modalHidden) pauseVideo();
		else play();
	});
	$effect(() => {
		if (!$seeking && !modalHidden) handleShowInterface();
	});
	$effect(() => {
		if ($paused) handleShowInterface();
	});
</script>

<!-- The player goes fullscreen with its dialogs: an element outside the fullscreen one is not shown -->
<div bind:this={$playerElement} class="w-full h-full">
	<Container />
	<Container
		class="w-full h-full relative bg-black"
		onmousemove={handleShowInterface}
		onNavigate={(e) => {
			if (!showInterface && e.direction !== 'down') {
				e.stopPropagation();
				e.preventNavigation();
			}
			handleShowInterface();
		}}
		onBack={(e) => {
			if (document.fullscreenElement) {
				e.stopPropagation();
				return;
			}
		}}
		onclick={() => togglePause?.()}
		ondblclick={() => toggleFullscreen()}
	>
		{#snippet children({ hasFocusWithin })}
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
			></div>
			<div
				class={classNames(
					'absolute inset-0 transition-opacity pointer-events-none',
					'bg-gradient-to-t from-secondary-950/75 from-0% to-[300px] to-transparent',
					{
						'opacity-0': !showInterface || !hasFocusWithin
					}
				)}
			></div>
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
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div onclick={(e) => e.stopPropagation()} ondblclick={(e) => e.stopPropagation()}>
					<Container
						direction="horizontal"
						onNavigate={(e) => {
							if (e.direction === 'up' && e.willLeaveContainer) {
								e.stopPropagation();
								e.preventNavigation();
								handleHideInterface();
							}
						}}
						class="flex justify-between px-2 py-4 items-end"
					>
						<div>
							<div class="text-secondary-300 font-medium text-wider text-xl mb-1 tracking-wide">
								{subtitle}
							</div>
							<h1 class="h1">
								{#if titlePrefix}<span class="text-secondary-400">{titlePrefix}</span>{/if}
								{title}
							</h1>
						</div>
						<div class="flex space-x-2">
							{#if PLATFORM_WEB && !isTv()}
								<VolumeControl
									volume={$audibleVolume}
									onVolumeChange={setVolume}
									onToggleMute={toggleMute}
								/>
							{/if}
							{#if $audioTrackState.tracks.length > 1}
								<IconButton
									onClickOrSelect={() => {
										modalStack.createModal(SelectAudioModal, {
											available: $audioTrackState.tracks,
											current: $audioTrackState.current,
											selectAudioTrack
										});
									}}
								>
									<ChatBubble size={24} />
								</IconButton>
							{/if}
							{#if $subtitleTrackState.tracks.length}
								<IconButton
									onClickOrSelect={() => {
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
									onClickOrSelect={() => {
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
								<IconButton onClickOrSelect={() => toggleFullscreen()}>
									{#if isFullscreen}
										<ExitFullScreen size={24} />
									{:else}
										<EnterFullScreen size={24} />
									{/if}
								</IconButton>
							{/if}
						</div>
					</Container>
					<ProgressBar
						bind:seeking={$seeking}
						onJumpTo={(e) => seekAndPlay(e)}
						onPlay={() => play()}
						onPause={() => pauseVideo()}
						duration={$duration}
						currentTime={$currentTime}
						bufferedTime={$bufferedTime}
						paused={$paused}
						selectable={progressBar}
					/>
				</div>
			</Container>
		{/snippet}
	</Container>

	<ModalStackProvider {modalStack} />
</div>

<svelte:window onkeypress={(e) => handleKeyboardShortcut?.(e)} />
<svelte:document onfullscreenchange={() => (isFullscreen = document.fullscreenElement !== null)} />
