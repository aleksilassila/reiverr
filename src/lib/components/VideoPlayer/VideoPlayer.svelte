<script lang="ts">
	import Container from '../../../Container.svelte';
	import VideoElement from './VideoElement.svelte';
	import type { PlaybackInfo, SubtitleInfo, Subtitles } from './VideoPlayer';
	import classNames from 'classnames';
	import ProgressBar from './ProgressBar.svelte';
	import { onDestroy } from 'svelte';
	import type { Selectable } from '../../selectable';
	import { modalStack } from '../Modal/modal.store';
	import SelectSubtitlesModal from './SelectSubtitlesModal.svelte';
	import { ChatBubble, TextAlignLeft } from 'radix-icons-svelte';
	import IconButton from './IconButton.svelte';
	import SelectAudioModal from './SelectAudioModal.svelte';

	export let playbackInfo: PlaybackInfo | undefined;
	export let subtitleInfo: SubtitleInfo | undefined;

	export let modalHidden = false;

	// Bindings
	export let paused = false;
	export let seeking = false;
	export let totalTime = 0;
	export let progressTime = 0;
	export let bufferedTime = 0;
	export let muted = false;
	export let volume = 1;
	export let videoDidLoad = false;

	export let video: HTMLVideoElement;

	let showInterface = true;
	let showInterfaceTimeout: ReturnType<typeof setTimeout>;
	let hideInterfaceTimeout: ReturnType<typeof setTimeout>;
	let container: Selectable;

	$: if (modalHidden) video?.pause();
	else video?.play();
	$: if (!seeking && !modalHidden) handleShowInterface();

	function handleShowInterface() {
		showInterface = true;
		clearTimeout(showInterfaceTimeout);
		showInterfaceTimeout = setTimeout(() => {
			if (!seeking && !modalHidden) handleHideInterface();
		}, 4000);
	}

	function handleHideInterface() {
		showInterface = false;
		clearTimeout(hideInterfaceTimeout);
		hideInterfaceTimeout = setTimeout(() => {
			container?.focusChild(1);
		}, 200);
	}

	function selectSubtitles(subtitles?: Subtitles) {
		if (subtitleInfo) {
			if (subtitles)
				subtitleInfo = {
					...subtitleInfo,
					subtitles
				};
			else
				subtitleInfo = {
					...subtitleInfo,
					subtitles: undefined
				};
		} else {
			console.error('No subtitle info when selecting subtitles');
		}
	}

	function selectAudioStream(index: number) {
		if (playbackInfo) playbackInfo.selectAudioTrack(index);
		else console.error('No playback info when selecting audio stream');
	}

	onDestroy(() => {
		clearTimeout(showInterfaceTimeout);
		clearTimeout(hideInterfaceTimeout);
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
>
	<VideoElement
		bind:playbackInfo
		bind:subtitleInfo
		bind:paused
		bind:seeking
		bind:totalTime
		bind:progressTime
		bind:bufferedTime
		bind:muted
		bind:volume
		bind:videoDidLoad
		bind:video
	/>
	<Container
		class={classNames('absolute inset-x-12 top-8 transition-opacity', {
			'opacity-0': !showInterface
		})}
	>
		Title
	</Container>
	<Container
		class={classNames('absolute inset-x-12 bottom-8 transition-opacity flex flex-col', {
			'opacity-0': !showInterface
		})}
		bind:selectable={container}
	>
		<Container
			direction="horizontal"
			on:navigate={({ detail }) => {
				if (detail.direction === 'up') {
					detail.stopPropagation();
					detail.preventNavigation();
					handleHideInterface();
				}
			}}
			class="flex justify-between p-2"
		>
			<div />
			<div class="flex space-x-2">
				<IconButton
					on:clickOrSelect={() => {
						// video.pause();
						modalStack.create(SelectSubtitlesModal, {
							subtitleInfo,
							selectSubtitles
						});
					}}
				>
					<TextAlignLeft size={19} />
				</IconButton>
				<IconButton
					on:clickOrSelect={() => {
						// video.pause();
						modalStack.create(SelectAudioModal, {
							selectedAudioStreamIndex: playbackInfo?.audioStreamIndex || -1,
							audioTracks: playbackInfo?.audioTracks || [],
							selectAudioStream
							// onClose: () => video.play()
						});
					}}
				>
					<ChatBubble size={19} />
				</IconButton>
			</div>
		</Container>
		<ProgressBar
			bind:seeking
			on:jumpTo={(e) => {
				video.currentTime = e.detail;
			}}
			bind:totalTime
			bind:progressTime
			bind:bufferedTime
			bind:paused
		/>
	</Container>
</Container>
