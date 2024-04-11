<script lang="ts">
	import Container from '../../../Container.svelte';
	import VideoElement from './VideoElement.svelte';
	import type { PlaybackInfo } from './VideoPlayer';
	import classNames from 'classnames';
	import ProgressBar from './ProgressBar.svelte';
	import { onDestroy } from 'svelte';
	import type { Readable } from 'svelte/store';
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
	let hideInterfaceTimeout: ReturnType<typeof setTimeout>;
	let container: Selectable;

	function handleMouseMove() {
		showInterface = true;
		clearTimeout(hideInterfaceTimeout);
		hideInterfaceTimeout = setTimeout(() => {
			if (seeking) handleMouseMove();
			else {
				showInterface = false;
				container?.focusChild(1);
			}
		}, 2000);
	}

	onDestroy(() => clearTimeout(hideInterfaceTimeout));
</script>

<Container class="w-full h-full relative" on:mousemove={handleMouseMove}>
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
		direction="horizontal"
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
		bind:container
	>
		<Container direction="horizontal">Buttons</Container>
		<ProgressBar
			bind:seeking
			on:jumpTo={(e) => {
				console.log(e.detail);
				video.currentTime = e.detail;
			}}
			bind:totalTime
			bind:progressTime
			bind:bufferedTime
			bind:paused
		/>
	</Container>
</Container>
