<script lang="ts">
	import Container from '../Container.svelte';
	import { createEventDispatcher } from 'svelte';
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
		paused = true;
	}

	function handleStopSeeking() {
		if (!seeking) return;

		paused = pausedBeforeSeeking;
		seeking = false;

		dispatch('jumpTo', progressTime);
	}

	let pauseTime = 0;
	const handlePause = (paused: boolean) => {
		if (paused) {
			pauseTime = progressTime;
		} else if (pauseTime > 0) {
			dispatch('jumpTo', pauseTime);
			pauseTime = 0;
		}
	};
	$: handlePause(paused);

	function handleNavigateEvent({ detail }: CustomEvent<NavigateEvent>) {
		if (detail.direction === 'left') {
			if (paused) {
				pauseTime = pauseTime - 10;
			} else {
				dispatch('jumpTo', progressTime - 10);
				detail.preventNavigation();
			}
		} else if (detail.direction === 'right') {
			if (paused) {
				pauseTime = pauseTime + 30;
			} else {
				dispatch('jumpTo', progressTime + 30);
				detail.preventNavigation();
			}
		}
	}
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
			style={`left: 0.5rem; right: calc(${
				(1 - (pauseTime > 0 ? pauseTime : progressTime) / totalTime) * 100
			}% - 0.5rem + ${(pauseTime > 0 ? pauseTime : progressTime) / totalTime}rem);`}
		/>

		<div
			class={classNames(
				'absolute inset-y-0 w-4 h-4 bg-primary-500 rounded-full drop-shadow-2xl transition-opacity',
				{
					'opacity-0 group-hover:opacity-100': !hasFocus
				}
			)}
			style={`left: calc(${((pauseTime > 0 ? pauseTime : progressTime) / totalTime) * 100}% - ${
				(pauseTime > 0 ? pauseTime : progressTime) / totalTime
			}rem);
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
		<span>{formatSecondsToTime(pauseTime || progressTime)}</span>
		<span>-{formatSecondsToTime(totalTime - (pauseTime || progressTime))}</span>
	</div>
</div>
