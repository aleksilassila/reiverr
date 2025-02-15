<script lang="ts">
	import classNames from 'classnames';
	import PlayButton from '../PlayButton.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import LazyImg from '../LazyImg.svelte';
	import type { TitleType } from '../../types';
	import Container from '../Container.svelte';
	import type { Readable } from 'svelte/store';
	import AnimatedSelection from '../AnimateScale.svelte';
	import { navigate } from '../StackRouter/StackRouter';
	import { getCardDimensions } from '../../utils';

	export let tmdbId: number | undefined = undefined;
	export let tvdbId: number | undefined = undefined;
	export let jellyfinId: string = '';
	export let type: TitleType = 'movie';
	export let backdropUrl: string = '';
	export let group = false;

	export let title = '';
	export let subtitle = '';
	export let rating: number | undefined = undefined;
	export let progress = 0;
	export let runtime = 0;

	export let disabled = false;
	export let shadow = false;
	export let size: 'dynamic' | 'md' | 'lg' | 'sm' = 'md';
	export let orientation: 'portrait' | 'landscape' = 'landscape';

	let hasFocus: Readable<boolean>;
	let dimensions = getCardDimensions(window.innerWidth);

	$: lowerLimit = Math.min(runtime ? 15 / runtime : 0.1, 0.1);
	$: upperLimit = 1 - Math.max(runtime ? 10 / runtime : 0.1, 0.1);
</script>

<svelte:window on:resize={(e) => (dimensions = getCardDimensions(e.currentTarget.innerWidth))} />

<div class="relative">
	{#if group}
		<div class="absolute inset-0 scale-95 translate-y-3.5 opacity-50">
			<LazyImg src={backdropUrl} class="absolute inset-0 rounded-xl" />
			<div class="absolute inset-0 bg-white/10 rounded-xl" />

			<LazyImg
				src={backdropUrl}
				class="absolute inset-0 scale-95 translate-y-4 rounded-xl opacity-25"
			/>
			<div class="absolute inset-0 scale-95 translate-y-4 rounded-xl bg-white/10 opacity-25" />
		</div>
	{/if}
	<AnimatedSelection hasFocus={$hasFocus}>
		<Container
			{...$$restProps}
			{disabled}
			on:clickOrSelect={() => {
				if (tmdbId || tvdbId) navigate(`/${type}/${tmdbId || tvdbId}`);
			}}
			on:enter
			class={classNames(
				'relative flex flex-shrink-0 rounded-xl group hover:text-inherit overflow-hidden text-left cursor-pointer',
				'selectable',
				{
					'aspect-video': orientation === 'landscape',
					'aspect-[2/3]': orientation === 'portrait',
					'w-32 h-48': size === 'sm' && orientation === 'portrait',
					'h-32 w-56': size === 'sm' && orientation === 'landscape',
					'w-44 h-64': size === 'md' && orientation === 'portrait',
					'h-44 w-80': size === 'md' && orientation === 'landscape',
					// 'w-60 h-96': size === 'lg' && orientation === 'portrait',
					'h-60 w-96': size === 'lg' && orientation === 'landscape',
					'w-full h-96': size === 'dynamic',
					'shadow-lg': shadow
				}
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
			<!--{:else}-->
			<!--	<LazyImg src={backdropUrl} class="absolute inset-0 opacity-10 " />-->
			<!--	<div class="absolute inset-0 bg-white/10 opacity-10" />-->
			<!--	<LazyImg-->
			<!--		src={backdropUrl}-->
			<!--		class="absolute inset-0 scale-95 translate-y-[0.5rem] rounded-xl opacity-25"-->
			<!--	/>-->
			<!--	<div class="absolute inset-0 bg-white/10 opacity-10" />-->
			<!--	<LazyImg-->
			<!--		src={backdropUrl}-->
			<!--		class="absolute inset-0 scale-90 translate-y-[1.125rem] rounded-xl "-->
			<!--	/>-->
			<!--{/if}-->
			<!-- This is the tinted and blurred hover overlay -->
			<!--		<div-->
			<!--			class="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-black"-->
			<!--			style="filter: blur(50px); transform: scale(3);"-->
			<!--		>-->
			<!--			<LazyImg src={backdropUrl} />-->
			<!--		</div>-->

			<!-- Mouse hover details -->
			<!--		<div-->
			<!--			class={classNames(-->
			<!--				'flex-1 flex flex-col justify-between bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity z-[1]',-->
			<!--				{-->
			<!--					'py-2 px-3': true-->
			<!--				}-->
			<!--			)}-->
			<!--		>-->
			<!--			<div class="flex justify-self-start justify-between">-->
			<!--				<slot name="top-left">-->
			<!--					<div>-->
			<!--						<h1 class="text-zinc-100 font-bold line-clamp-2 text-lg">{title}</h1>-->
			<!--						<h2 class="text-zinc-300 text-sm font-medium line-clamp-2">{subtitle}</h2>-->
			<!--					</div>-->
			<!--				</slot>-->
			<!--				<slot name="top-right">-->
			<!--					<div />-->
			<!--				</slot>-->
			<!--			</div>-->
			<!--			<div class="flex justify-self-end justify-between">-->
			<!--				<slot name="bottom-left">-->
			<!--					<div>-->
			<!--						{#if rating}-->
			<!--							<h2 class="flex items-center gap-1.5 text-sm text-zinc-300 font-medium">-->
			<!--								<Star />{rating.toFixed(1)}-->
			<!--							</h2>-->
			<!--						{/if}-->
			<!--					</div>-->
			<!--				</slot>-->
			<!--				<slot name="bottom-right">-->
			<!--					<div />-->
			<!--				</slot>-->
			<!--			</div>-->
			<!--		</div>-->

			<!-- Play Button -->
			<!-- {#if jellyfinId}
				<div class="absolute inset-0 flex items-center justify-center z-[1]">
					<PlayButton
						on:click={(e) => {
							e.preventDefault();
							jellyfinId && true; //playerState.streamJellyfinId(jellyfinId);
						}}
						class="sm:opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</div>
			{/if} -->
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
