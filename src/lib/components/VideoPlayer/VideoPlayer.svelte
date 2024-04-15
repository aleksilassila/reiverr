<script lang="ts">
	import Container from '../../../Container.svelte';
	import VideoElement from './VideoElement.svelte';
	import type { PlaybackInfo } from './VideoPlayer';
	import classNames from 'classnames';
	import ProgressBar from './ProgressBar.svelte';
	import { onDestroy } from 'svelte';
	import type { Selectable } from '../../selectable';

	export let playbackInfo: PlaybackInfo | undefined;

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

	function handleShowInterface() {
		showInterface = true;
		clearTimeout(showInterfaceTimeout);
		showInterfaceTimeout = setTimeout(() => {
			if (seeking) handleShowInterface();
			else handleHideInterface();
		}, 5000);
	}

	function handleHideInterface() {
		showInterface = false;
		clearTimeout(hideInterfaceTimeout);
		hideInterfaceTimeout = setTimeout(() => {
			container?.focusChild(1);
		}, 200);
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
		>
			Buttons
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
