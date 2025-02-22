<script lang="ts">
	import classNames from 'classnames';
	import { Pause, TextAlignLeft } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import type { Selectable } from '../../selectable';
	import Container from '../Container.svelte';
	import { modalStack } from '../Modal/modal.store';
	import Spinner from '../Utils/Spinner.svelte';
	import IconButton from '../IconButton.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import SelectSubtitlesModal from './SelectSubtitlesModal.svelte';
	import VideoElement from './VideoElement.svelte';
	import type { SubtitleInfo, VideoSource } from './VideoPlayer';
	import type { SubtitlesDto } from '$lib/apis/reiverr/reiverr.openapi';

	export let videoSource: VideoSource | undefined;
	export let subtitleInfo: SubtitleInfo | undefined;
	export let title: string;
	export let subtitle: string = '';
	export let source: string = '';

	export let modalHidden = false;

	// Bindings
	export let videoDidLoad = false;
	export let paused = false;
	export let duration = 0;
	export let currentTime = 0;
	export let bufferedTime = 0;
	let buffering = false;
	export let muted = false;
	export let volume = 1;
	let seeking = false;

	export let video: HTMLVideoElement;

	let showInterface = true;
	let showInterfaceTimeout: ReturnType<typeof setTimeout>;
	let hideInterfaceTimeout: ReturnType<typeof setTimeout>;
	let container: Selectable;

	let clockTime = 0;
	let clockInterval = setInterval(() => {
		clockTime = Date.now();
	}, 1000);

	$: if (modalHidden) video?.pause();
	else video?.play();
	$: if (!seeking && !modalHidden) handleShowInterface();
	$: if (paused) handleShowInterface();

	function handleShowInterface() {
		showInterface = true;
		clearTimeout(showInterfaceTimeout);
		showInterfaceTimeout = setTimeout(() => {
			if (!seeking && !modalHidden) handleHideInterface();
		}, 5000);
	}

	function handleHideInterface() {
		showInterface = false;
		clearTimeout(hideInterfaceTimeout);
		hideInterfaceTimeout = setTimeout(() => {
			container?.focusChild(1);
		}, 200);
	}

	function selectSubtitles(subtitles?: SubtitlesDto) {
		if (subtitleInfo) {
			subtitleInfo.selectSubtitles(subtitles);
		} else {
			console.error('No subtitle info when selecting subtitles');
		}
	}

	function selectAudioStream(index: number) {
		if (videoSource) videoSource.selectAudioTrack(index);
		else console.error('No playback info when selecting audio stream');
	}

	function handleShortcuts(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'k') {
			e.preventDefault();
			if (paused) video.play();
			else video.pause();
		} else if (e.key === 'm') {
			e.preventDefault();
			video.muted = !video.muted;
		} else if (e.key === 'f') {
			e.preventDefault();
			if (document.fullscreenElement) document.exitFullscreen();
			else video.requestFullscreen();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			video.volume = Math.min(video.volume + 0.1, 1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			video.volume = Math.max(video.volume - 0.1, 0);
		}
	}

	onDestroy(() => {
		clearTimeout(showInterfaceTimeout);
		clearTimeout(hideInterfaceTimeout);
		clearInterval(clockInterval);
	});
</script>

<Container
	class="w-full h-full relative"
	on:mousemove={handleShowInterface}
	on:navigate={({ detail }) => {
		if (!showInterface) {
			detail.stopPropagation();
			detail.preventNavigation();
		}
		handleShowInterface();
	}}
	on:click={() => (paused ? video?.play() : video?.pause())}
>
	<VideoElement
		bind:videoSource
		bind:paused
		bind:duration
		bind:currentTime
		bind:bufferedTime
		bind:muted
		bind:volume
		bind:videoDidLoad
		bind:video
		bind:buffering
		subtitles={subtitleInfo?.subtitles}
	/>

	<!-- Overlay secondary-950/75 -->
	<div
		class={classNames(
			'absolute inset-0 transition-opacity pointer-events-none',
			'bg-gradient-to-b from-secondary-950/75 from-0% to-[100px] to-transparent',
			{
				'opacity-0': !showInterface
			}
		)}
	/>
	<div
		class={classNames(
			'absolute inset-0 transition-opacity pointer-events-none',
			'bg-gradient-to-t from-secondary-950/75 from-0% to-[300px] to-transparent',
			{
				'opacity-0': !showInterface
			}
		)}
	/>
	<Container
		class={classNames('absolute inset-x-12 top-8 transition-opacity', {
			'opacity-0': !showInterface
		})}
	>
		<!--		Title-->
	</Container>

	{#if paused && showInterface && !seeking}
		<div
			class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
		>
			<Pause class="w-12 h-12" />
		</div>
	{:else if (buffering && !paused) || !videoDidLoad}
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
				'opacity-0': !showInterface
			}
		)}
		bind:selectable={container}
	>
		<div
			class="flex justify-between items-center text-secondary-300 font-medium text-wider text-xl tracking-wide"
		>
			<div>@{source}</div>

			<div>
				Ends at {new Date(
					clockTime + ((duration ?? 0) - (currentTime ?? 0)) * 1000
				).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
			</div>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click={(e) => e.stopPropagation()}>
			<Container
				direction="horizontal"
				on:navigate={({ detail }) => {
					if (detail.direction === 'up') {
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
					{#if subtitleInfo?.availableSubtitles?.length}
						<IconButton
							on:clickOrSelect={() => {
								// video.pause();
								modalStack.create(SelectSubtitlesModal, {
									subtitles: subtitleInfo.availableSubtitles,
									selectedSubtitles: subtitleInfo.subtitles,
									selectSubtitles
								});
							}}
						>
							<TextAlignLeft size={24} />
						</IconButton>
					{/if}
					<!-- <IconButton
						on:clickOrSelect={() => {
							modalStack.create(SelectAudioModal, {
								selectedAudioStreamIndex: playbackInfo?.audioStreamIndex || -1,
								audioTracks: playbackInfo?.audioTracks || [],
								selectAudioStream
							});
						}}
					>
						<ChatBubble size={24} />
					</IconButton> -->
				</div>
			</Container>
			<ProgressBar
				bind:seeking
				on:jumpTo={(e) => {
					video.currentTime = e.detail;
					video.play();
				}}
				on:play={() => video.play()}
				on:pause={() => video.pause()}
				{duration}
				{currentTime}
				{bufferedTime}
				bind:paused
			/>
		</div>
	</Container>
</Container>

<svelte:window on:keypress={handleShortcuts} />
