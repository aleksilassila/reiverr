<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import { ArrowDown, Check, TriangleRight } from 'radix-icons-svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from '../AnimateScale.svelte';
	import { getCardDimensions } from '../../utils';

	export let episodeNumber: number;
	export let episodeName: string;
	export let backdropUrl: string;
	// export let handlePlay: (() => void) | undefined = undefined;
	export let isWatched = false;
	export let progress = 0;
	export let runtime = 0;
	export let releaseDate = 0;

	$: lowerLimit = Math.min(runtime ? 15 / runtime : 0.1, 0.1);
	$: upperLimit = 1 - Math.max(runtime ? 10 / runtime : 0.1, 0.1);

	// $: isOnDeck = handlePlay !== undefined;

	let hasFocus: Readable<boolean>;
	let dimensions = getCardDimensions(window.innerWidth, 'landscape');
</script>

<svelte:window
	on:resize={(e) => (dimensions = getCardDimensions(e.currentTarget.innerWidth, 'landscape'))}
/>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'flex flex-col shrink-0',
			'overflow-hidden rounded-2xl cursor-pointer group relative px-4 py-3 selectable transition-opacity'
		)}
		style={`width: ${dimensions.width}px; height: ${dimensions.height}px`}
		on:clickOrSelect
		on:enter
		on:mount
		bind:hasFocus
		focusOnClick
	>
		<div class="flex-1 flex flex-col z-10">
			<div class="flex-1 flex flex-col">
				<!--{#if isWatched}-->
				<!--	<div class="rounded-full p-1 bg-primary-500 self-start">-->
				<!--		<Check class="text-secondary-800" size={19} />-->
				<!--	</div>-->
				<!--{/if}-->
				<!-- {#if isWatched}
					<div class="rounded-full p-1 bg-primary-500 self-start">
						<Check class="text-secondary-800" size={16} />
					</div>
				{/if} -->
			</div>
			<div class="flex-1 flex flex-col justify-end">
				<!--				<h2 class="text-zinc-300 font-medium">Episode {episodeNumber}</h2>-->
				<!--				<h1 class="text-zinc-100 text-lg font-medium line-clamp-2">{episodeName}</h1>-->
				<!-- Progress Bar -->
				{#if progress !== 0 && progress > lowerLimit && progress < upperLimit}
					<div class="relative bg-zinc-300/50 rounded-full h-1 overflow-hidden mt-2">
						<div
							class="absolute inset-y-0 bg-white left-0"
							style={`width: ${(progress * 100).toFixed(0)}%`}
						/>
					</div>
				{/if}
			</div>
		</div>
		<!-- Background Image -->
		<div
			class={classNames('absolute inset-0 bg-center bg-cover', {
				// 'opacity-75': !isOnDeck && !$hasFocus
			})}
			style={`background-image: url('${backdropUrl}')`}
		/>
		<!-- Background Overlay / Tint -->
		<!-- <div
			class={classNames('absolute inset-0', {
				// 'bg-gradient-to-t from-secondary-900/75 from-10% to-40%': isOnDeck,
				'bg-primary-950/50': !true
				// 'to-secondary-900/25': !isOnDeck && $hasFocus

				// isOnDeck || $hasFocus,
				// 'bg-gradient-to-t from-secondary-900/75 from-10% to-40% to-secondary-900/25':
				// 	!isOnDeck && !$hasFocus
			})}
		/> -->
		<!-- <div
			class={classNames(
				'opacity-0 group-hover:opacity-100 absolute inset-0 z-20 flex items-center justify-center'
			)}
		>
			{#if handlePlay} -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- <div
					class={classNames(
						'rounded-full p-2.5 cursor-pointer',
						'bg-zinc-900/90 text-zinc-200',
						'group-focus-within:text-secondary-800 group-focus-within:bg-primary-500 hover:bg-primary-500 hover:text-secondary-800'
					)}
					on:click={handlePlay}
				>
					<TriangleRight size={32} />
				</div> -->
		<!-- {:else if !isOnDeck}
				<div
					class={classNames(
						'rounded-full p-4 cursor-pointer',
						'bg-zinc-900/90 text-zinc-200',
						'hover:bg-primary-500 hover:text-secondary-800' // group-focus-within:text-secondary-800 group-focus-within:bg-primary-500
					)}
				>
					<ArrowDown size={19} />
				</div>
			{/if}
		</div> -->
	</Container>
	<div class="mt-2 flex items-center justify-between">
		<div class="">
			<div class="flex items-center space-x-2">
				{#if isWatched}
					<div class="rounded-full p-0.5 bg-primary-500">
						<Check class="text-secondary-800" size={15} />
					</div>
				{/if}
				<h1 class="text-secondary-100 text-lg font-medium line-clamp-2">{episodeName}</h1>
			</div>
			<h2 class="text-secondary-300 font-medium">Episode {episodeNumber}</h2>
		</div>
		<div class="self-start">
			<div class="text-secondary-300 font-medium">
				{#if releaseDate > 0 && releaseDate > Date.now()}
					{new Date(releaseDate).toLocaleTimeString('en-US', {
						month: 'short',
						day: 'numeric',
						weekday: 'short',
						hour: 'numeric',
						minute: 'numeric'
					})}
				{:else if runtime > 0}
					{runtime} Min
				{/if}
			</div>
		</div>
	</div>
</AnimateScale>
