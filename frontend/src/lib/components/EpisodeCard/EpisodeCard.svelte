<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';

	import type { MediaStatusTags } from '$lib/components/status-tags';
	import classNames from 'classnames';
	import { Check, DotsVertical } from 'radix-icons-svelte';
	import { getCardDimensions } from '../../utils';
	import AnimateScale from '../AnimateScale.svelte';
	import Container from '../Container.svelte';
	import StatusTags from '../StatusTags.svelte';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onclick?: ContainerProps['onclick'];
		onEnter?: ContainerProps['onEnter'];
		onMounted?: ContainerProps['onMounted'];
		onSelect?: ContainerProps['onSelect'];
		onmouseenter?: ContainerProps['onmouseenter'];
		onmouseleave?: ContainerProps['onmouseleave'];
		episodeNumber: number;
		episodeName: string;
		backdropUrl: string;
		// export let handlePlay: (() => void) | undefined = undefined;
		isWatched?: boolean;
		progress?: number;
		runtime?: number;
		releaseDate?: number;
		statusTags?: MediaStatusTags;
		/** Opens the actions of the episode: a long press on the remote, or the dots that show on hover */
		onLongPress?: (() => void) | undefined;
		class?: string;
	}

	let {
		episodeNumber,
		episodeName,
		backdropUrl,
		isWatched = false,
		progress = 0,
		runtime = 0,
		releaseDate = 0,
		statusTags = {},
		onLongPress = undefined,
		onClickOrSelect,
		onclick,
		onEnter,
		onMounted,
		onSelect,
		onmouseenter,
		onmouseleave,
		class: className
	}: Props = $props();

	let lowerLimit = $derived(Math.min(runtime ? 15 / runtime : 0.1, 0.1));
	let upperLimit = $derived(1 - Math.max(runtime ? 10 / runtime : 0.1, 0.1));

	// $: isOnDeck = handlePlay !== undefined;

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
	let dimensions = $state(
		getCardDimensions({
			viewportWidth: window.innerWidth,
			orientation: 'landscape'
		})
	);
</script>

<svelte:window
	onresize={(e) =>
		(dimensions = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation: 'landscape'
		}))}
/>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'flex flex-col shrink-0',
			'overflow-hidden rounded-2xl cursor-pointer group relative px-4 py-3 selectable',
			className
		)}
		style={`width: ${dimensions.width}px; height: ${dimensions.height}px`}
		{onClickOrSelect}
		{onclick}
		{onEnter}
		{onMounted}
		{onSelect}
		{onmouseenter}
		{onmouseleave}
		{selectable}
		focusOnClick
		{onLongPress}
	>
		{#if onLongPress}
			<button
				class="absolute top-2 right-2 z-20 rounded-full p-1.5 bg-secondary-950/75 text-secondary-200 opacity-0 group-hover:opacity-100 hover:bg-primary-500 hover:text-secondary-950 transition-opacity"
				onclick={(e) => {
					e.stopPropagation();
					onLongPress?.();
				}}
			>
				<DotsVertical size={20} />
			</button>
		{/if}
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
						></div>
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
		></div>
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
		<!-- <div
					class={classNames(
						'rounded-full p-2.5 cursor-pointer',
						'bg-zinc-900/90 text-zinc-200',
						'group-focus-within:text-secondary-800 group-focus-within:bg-primary-500 hover:bg-primary-500 hover:text-secondary-800'
					)}
				 onclick={handlePlay}
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
				<h1 class="text-secondary-100 text-lg font-medium line-clamp-1">{episodeName}</h1>
			</div>
			<h2 class="text-secondary-300 font-medium">
				<span>
					Episode {episodeNumber}
				</span>
				•
				<span>
					{#if releaseDate > 0 && releaseDate > Date.now()}
						{new Date(releaseDate).toLocaleDateString('en-US', {
							weekday: 'short',
							month: 'short',
							day: 'numeric'
						})}
					{:else if runtime > 0}
						{runtime} Min
					{/if}
				</span>
			</h2>
		</div>
		<div class="self-end flex-shrink-0 ml-2">
			<StatusTags tags={statusTags} size="sm" direction="right" />
			<!-- <div class="text-secondary-300 font-medium">
				{#if releaseDate > 0 && releaseDate > Date.now()}
					{new Date(releaseDate).toLocaleDateString('en-US', {
						weekday: 'short',
						month: 'short',
						day: 'numeric'
					})}
				{:else if runtime > 0}
					{runtime} Min
				{/if}
			</div> -->
		</div>
	</div>
</AnimateScale>
