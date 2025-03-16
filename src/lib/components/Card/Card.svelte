<script lang="ts">
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import type { TitleType } from '../../types';
	import { getCardDimensions } from '../../utils';
	import AnimatedSelection from '../AnimateScale.svelte';
	import Container from '../Container.svelte';
	import LazyImg from '../LazyImg.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { navigate } from '../StackRouter/StackRouter';
	import { createEventDispatcher } from 'svelte';
	import type { Selectable } from '$lib/selectable';
	import PlayButton from '../PlayButton.svelte';

	const dispatch = createEventDispatcher<{
		clickOrSelect: Selectable;
	}>();

	/** @deprecated delete tmdb and navigation from card*/
	export let tmdbId: number | undefined = undefined;
	export let type: TitleType = 'movie';
	export let backdropUrl: string = '';
	export let playButton = false;
	// export let group = false;

	export let title = '';
	export let progress = 0;
	export let runtime = 0;

	export let disabled = false;
	export let size: 'md' | 'lg' | 'sm' = 'md';
	export let orientation: 'portrait' | 'landscape' = 'landscape';

	let hasFocus: Readable<boolean>;
	let dimensions = getCardDimensions({ viewportWidth: window.innerWidth, orientation, size });

	$: lowerLimit = Math.min(runtime ? 15 / runtime : 0.1, 0.1);
	$: upperLimit = 1 - Math.max(runtime ? 10 / runtime : 0.1, 0.1);
</script>

<svelte:window
	on:resize={(e) =>
		(dimensions = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation,
			size
		}))}
/>

<div class="relative">
	<!-- {#if group}
		<div class="absolute inset-0 scale-95 translate-y-3.5 opacity-50">
			<LazyImg src={backdropUrl} class="absolute inset-0 rounded-xl" />
			<div class="absolute inset-0 bg-white/10 rounded-xl" />

			<LazyImg
				src={backdropUrl}
				class="absolute inset-0 scale-95 translate-y-4 rounded-xl opacity-25"
			/>
			<div class="absolute inset-0 scale-95 translate-y-4 rounded-xl bg-white/10 opacity-25" />
		</div>
	{/if} -->
	<AnimatedSelection hasFocus={$hasFocus}>
		<Container
			{...$$restProps}
			{disabled}
			on:clickOrSelect={({ detail }) => {
				if (tmdbId) navigate(`/${type}/${tmdbId}`);
				dispatch('clickOrSelect', detail);
			}}
			on:enter
			on:click
			class={classNames(
				'relative flex flex-shrink-0 rounded-xl group hover:text-inherit overflow-hidden text-left cursor-pointer',
				'selectable'
			)}
			style={`width: ${dimensions.width}px; height: ${dimensions.height}px;`}
			focusOnClick
			bind:hasFocus
		>
			<!--{#if !group}-->
			{#if backdropUrl}
				<LazyImg src={backdropUrl} class="absolute inset-0" />
			{:else}
				<div class="absolute inset-0 bg-secondary-700 h1 flex items-center justify-center">
					{title}
				</div>
			{/if}

			{#if playButton}
				<div class="absolute inset-0 flex items-center justify-center z-10">
					<PlayButton />
				</div>
			{/if}

			{#if progress && progress > lowerLimit && progress < upperLimit}
				<div
					class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 bg-gradient-to-t ease-in-out z-[1]"
				>
					<ProgressBar {progress} />
				</div>
			{/if}
		</Container>
	</AnimatedSelection>
</div>
