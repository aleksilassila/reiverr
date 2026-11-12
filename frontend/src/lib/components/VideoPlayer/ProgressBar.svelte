<script lang="ts">
	import classNames from 'classnames';
	import { untrack } from 'svelte';
	import type { NavigateEvent, Selectable } from '../../selectable';
	import { formatSecondsToTime } from '../../utils';
	import Container from '../Container.svelte';

	interface Props {
		selectable?: Selectable;
		onJumpTo?: (detail: number) => void;
		onPlay?: () => void;
		onPause?: () => void;
		duration: number;
		currentTime: number;
		bufferedTime: number;
		step?: number;
		paused?: boolean;
		seeking?: boolean;
	}

	let {
		duration,
		currentTime,
		bufferedTime,
		step = 0.1,
		paused = false,
		seeking = $bindable(false),
		onJumpTo,
		onPlay,
		onPause,
		selectable
	}: Props = $props();

	let displayTime = $state(currentTime);

	const updateDisplayTime = (time: number) => {
		if (!seeking) {
			displayTime = time;
		}
	};
	$effect(() => {
		updateDisplayTime(currentTime);
	});

	let pausedBeforeSeeking = paused;
	function handleStartSeeking() {
		seeking = true;

		pausedBeforeSeeking = paused;
		onPause?.();
	}

	function handleStopSeeking() {
		if (!seeking) return;

		onJumpTo?.(displayTime);

		if (!pausedBeforeSeeking) {
			onPlay?.();
		} else {
			onPause?.();
		}
		seeking = false;
	}

	let pauseTime: number | undefined = $state(undefined);
	// Once the pause ends, the player jumps to where seeking while paused got to
	$effect(() => {
		if (paused) return;
		untrack(() => {
			if (pauseTime !== undefined) {
				onJumpTo?.(pauseTime);
				displayTime = pauseTime;
				pauseTime = undefined;
			}
		});
	});

	function handleNavigateEvent(e: NavigateEvent) {
		if (e.direction === 'left') {
			if (paused) {
				pauseTime = Math.max(0, (pauseTime ?? currentTime) - 10);
			} else {
				onJumpTo?.(displayTime - 10);
				e.preventNavigation();
			}
		} else if (e.direction === 'right') {
			if (paused) {
				pauseTime = Math.min(duration, (pauseTime ?? currentTime) + 30);
			} else {
				onJumpTo?.(displayTime + 30);
				e.preventNavigation();
			}
		}
	}
</script>

<div class="w-full flex flex-col">
	<Container
		class="h-4 relative overflow-hidden group"
		focusOnMount
		onNavigate={handleNavigateEvent}
		onSelect={() => (paused ? onPlay : onPause)?.()}
		{selectable}
	>
		{#snippet children({ hasFocus })}
			<div class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50"></div>

			<!-- Secondary progress -->
			<div
				class="absolute inset-y-1 inset-x-2 rounded-full bg-zinc-300/50 transition-transform"
				style={`left: 0.5rem; right: calc(${(1 - bufferedTime / duration) * 100}% - 0.5rem + ${
					bufferedTime / duration
				}rem);`}
			></div>

			<!-- Primary progress -->
			<div
				class="absolute inset-y-1 inset-x-2 rounded-full bg-secondary-100 transition-transform"
				style={`left: 0.5rem; right: calc(${
					(1 - (pauseTime ?? displayTime) / duration) * 100
				}% - 0.5rem + ${(pauseTime ?? displayTime) / duration}rem);`}
			></div>

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
			></div>

			<input
				type="range"
				class="w-full absolute cursor-pointer h-4 inset-y-0 opacity-0"
				min={0}
				max={duration}
				{step}
				bind:value={displayTime}
				onmousedown={handleStartSeeking}
				onmouseup={handleStopSeeking}
				ontouchstart={handleStartSeeking}
				ontouchend={handleStopSeeking}
			/>
		{/snippet}
	</Container>
	<div class="flex justify-between px-2 pt-4 text-lg">
		<span>{formatSecondsToTime(pauseTime || displayTime)}</span>
		<span>-{formatSecondsToTime(duration - (pauseTime || displayTime))}</span>
	</div>
</div>
