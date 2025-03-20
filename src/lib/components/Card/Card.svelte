<script lang="ts">
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import { getCardDimensions } from '../../utils';
	import AnimatedSelection from '../AnimateScale.svelte';
	import Container from '../Container.svelte';
	import LazyImg from '../LazyImg.svelte';
	import ProgressBar from '../ProgressBar.svelte';

	export let backdropUrl: string = '';
	// export let group = false;

	export let title = '';
	export let progress = 0; // keep
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
			on:clickOrSelect
			on:enter
			on:click
			class={classNames(
				'relative flex flex-shrink-0 rounded-xl group hover:text-inherit overflow-hidden text-left cursor-pointer',
				'selectable',
				$$restProps.class
			)}
			style={`width: ${dimensions.width}px; height: ${dimensions.height}px;`}
			focusOnClick
			bind:hasFocus
		>
			<!--{#if !group}-->
			<slot hasFocus={$hasFocus} width={dimensions.width} height={dimensions.height}>
				{#if backdropUrl}
					<LazyImg
						src={backdropUrl}
						class="absolute inset-0"
						width={dimensions.width}
						height={dimensions.height}
					/>
				{:else}
					<h1 class="text-center flex-1 h2 bg-primary-800 flex items-center justify-center p-4">
						{title}
					</h1>
				{/if}
			</slot>

			{#if progress && progress > lowerLimit && progress < upperLimit}
				<div
					class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 bg-gradient-to-t ease-in-out"
				>
					<ProgressBar {progress} />
				</div>
			{/if}
		</Container>
	</AnimatedSelection>
</div>
