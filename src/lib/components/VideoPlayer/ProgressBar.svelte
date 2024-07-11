<script lang="ts">
	import Container from '../../../Container.svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import classNames from 'classnames';
	import type { NavigateEvent } from '../../selectable';
	import { formatMinutesToTime, formatSecondsToTime } from '../../utils';

	export let totalTime: number;
	export let progressTime: number;
	export let bufferedTime: number;
	export let step = 0.1;
	export let paused = false;

	export let seeking = false;

	const dispatch = createEventDispatcher<{
		jumpTo: number;
		playPause: void;
	}>();

	let pausedBeforeSeeking = paused;
	function handleStartSeeking() {
		seeking = true;

		pausedBeforeSeeking = paused;
		// paused = true;
	}

	function handleStopSeeking() {
		if (!seeking) return;

		paused = pausedBeforeSeeking;
		seeking = false;

		dispatch('jumpTo', progressTime);
	}

	let seekingTimeout: ReturnType<typeof setTimeout>;
	function handleNavigateEvent({ detail }: CustomEvent<NavigateEvent>) {
		if (detail.direction === 'left') {
			// dispatch('jumpTo', progressTime - 10);
			handleStartSeeking();
			progressTime -= 10;
			clearTimeout(seekingTimeout);
			seekingTimeout = setTimeout(() => {
				handleStopSeeking();
			}, 1000);
			detail.preventNavigation();
		} else if (detail.direction === 'right') {
			// dispatch('jumpTo', progressTime + 30);
			handleStartSeeking();
			progressTime += 30;
			clearTimeout(seekingTimeout);
			seekingTimeout = setTimeout(() => {
				handleStopSeeking();
			}, 1000);
			detail.preventNavigation();
		}
	}

	onDestroy(() => {
		clearTimeout(seekingTimeout);
	});
</script>

<div class="w-full flex flex-col">
	<Container
		class="h-4 relative overflow-hidden group"
		let:hasFocus
		focusOnMount
		on:navigate={handleNavigateEvent}
		on:select={() => dispatch('playPause')}
	>
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
			class="absolute inset-y-1 inset-x-2 rounded-full bg-secondary-100 transition-transform"
			style={`left: 0.5rem; right: calc(${(1 - progressTime / totalTime) * 100}% - 0.5rem + ${
				progressTime / totalTime
			}rem);`}
		/>

		<div
			class={classNames(
				'absolute inset-y-0 w-4 h-4 bg-primary-500 rounded-full drop-shadow-2xl transition-opacity',
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
	<div class="flex justify-between px-2 pt-4 text-lg">
		<span>{formatSecondsToTime(progressTime)}</span>
		<span>-{formatSecondsToTime(totalTime - progressTime)}</span>
	</div>
</div>
