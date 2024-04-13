<script lang="ts">
	import Container from '../../../Container.svelte';
	import { createEventDispatcher } from 'svelte';
	import classNames from 'classnames';

	export let totalTime: number;
	export let progressTime: number;
	export let bufferedTime: number;
	export let step = 0.1;
	export let paused = false;

	export let seeking = false;

	const dispatch = createEventDispatcher<{
		jumpTo: number;
	}>();

	let pausedBeforeSeeking = paused;
	function handleStartSeeking() {
		seeking = true;

		pausedBeforeSeeking = paused;
		paused = true;
	}

	function handleStopSeeking() {
		if (!seeking) return;

		paused = pausedBeforeSeeking;
		seeking = false;

		dispatch('jumpTo', progressTime);
	}
</script>

<Container class="w-full h-4 relative overflow-hidden -mx-1 group" let:hasFocus focusOnMount>
	<div class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50" />

	<!-- Secondary progress -->
	<div
		class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50 transition-transform"
		style={`left: 0.5rem; right: calc(${(1 - bufferedTime / totalTime) * 100}% - 0.5rem + ${
			bufferedTime / totalTime
		}rem);`}
	/>

	<!-- Primary progress -->
	<div
		class="absolute inset-y-1 inset-x-2 rounded-full bg-white transition-transform"
		style={`left: 0.5rem; right: calc(${(1 - progressTime / totalTime) * 100}% - 0.5rem + ${
			progressTime / totalTime
		}rem);`}
	/>

	<div
		class={classNames(
			'absolute inset-y-0 w-4 h-4 bg-white rounded-full drop-shadow-2xl transition-opacity',
			{
				'opacity-0 group-hover:opacity-100': !hasFocus
			}
		)}
		style={`left: calc(${(progressTime / totalTime) * 100}% - ${progressTime / totalTime}rem);
		box-shadow: 0 0 0.25rem 2px #00000033;
		`}
	/>

	<input
		type="range"
		class="w-full absolute cursor-pointer h-4 inset-y-0 opacity-0"
		min={0}
		max={totalTime}
		{step}
		bind:value={progressTime}
		on:mousedown={handleStartSeeking}
		on:mouseup={handleStopSeeking}
		on:touchstart={handleStartSeeking}
		on:touchend={handleStopSeeking}
	/>
</Container>
