<script lang="ts">
	import Container from '../Container.svelte';
	import { createEventDispatcher } from 'svelte';
	import classNames from 'classnames';
	import type { NavigateEvent } from '../../selectable';
	import { formatMinutesToTime, formatSecondsToTime } from '../../utils';

	export let duration: number;
	export let currentTime: number;
	export let bufferedTime: number;
	export let step = 0.1;
	export let paused = false;
	export let seeking = false;

	let displayTime = currentTime;

	const updateDisplayTime = (time: number) => {
		if (!seeking) {
			displayTime = time;
		}
	};
	$: updateDisplayTime(currentTime);

	const dispatch = createEventDispatcher<{
		jumpTo: number;
		play: void;
		pause: void;
	}>();

	let pausedBeforeSeeking = paused;
	function handleStartSeeking() {
		seeking = true;

		pausedBeforeSeeking = paused;
		dispatch('pause');
	}

	function handleStopSeeking() {
		if (!seeking) return;

		dispatch('jumpTo', displayTime);

		if (!pausedBeforeSeeking) {
			dispatch('play');
		} else {
			dispatch('pause');
		}
		seeking = false;
	}

	let pauseTime: number | undefined = undefined;
	const handlePause = (paused: boolean) => {
		if (pauseTime !== undefined) {
			dispatch('jumpTo', pauseTime);
			displayTime = pauseTime;
			pauseTime = undefined;
		}
	};
	$: handlePause(paused);

	function handleNavigateEvent({ detail }: CustomEvent<NavigateEvent>) {
		if (detail.direction === 'left') {
			if (paused) {
				pauseTime = Math.max(0, (pauseTime ?? currentTime) - 10);
			} else {
				dispatch('jumpTo', displayTime - 10);
				detail.preventNavigation();
			}
		} else if (detail.direction === 'right') {
			if (paused) {
				pauseTime = Math.min(duration, (pauseTime ?? currentTime) + 30);
			} else {
				dispatch('jumpTo', displayTime + 30);
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
		on:select={() => dispatch(paused ? 'play' : 'pause')}
	>
		<div class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50" />

		<!-- Secondary progress -->
		<div
			class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50 transition-transform"
			style={`left: 0.5rem; right: calc(${(1 - bufferedTime / duration) * 100}% - 0.5rem + ${
				bufferedTime / duration
			}rem);`}
		/>

		<!-- Primary progress -->
		<div
			class="absolute inset-y-1 inset-x-2 rounded-full bg-secondary-100 transition-transform"
			style={`left: 0.5rem; right: calc(${
				(1 - (pauseTime ?? displayTime) / duration) * 100
			}% - 0.5rem + ${(pauseTime ?? displayTime) / duration}rem);`}
		/>

		<div
			class={classNames(
				'absolute inset-y-0 w-4 h-4 bg-primary-500 rounded-full drop-shadow-2xl transition-opacity',
				{
					'opacity-0 group-hover:opacity-100': !hasFocus
				}
			)}
			style={`left: calc(${((pauseTime ?? displayTime) / duration) * 100}% - ${
				(pauseTime ?? displayTime) / duration
			}rem);
		box-shadow: 0 0 0.25rem 2px #00000033;
		`}
		/>

		<input
			type="range"
			class="w-full absolute cursor-pointer h-4 inset-y-0 opacity-0"
			min={0}
			max={duration}
			{step}
			bind:value={displayTime}
			on:mousedown={handleStartSeeking}
			on:mouseup={handleStopSeeking}
			on:touchstart={handleStartSeeking}
			on:touchend={handleStopSeeking}
		/>
	</Container>
	<div class="flex justify-between px-2 pt-4 text-lg">
		<span>{formatSecondsToTime(pauseTime || displayTime)}</span>
		<span>-{formatSecondsToTime(duration - (pauseTime || displayTime))}</span>
	</div>
</div>
