<script lang="ts">
	import type { TitleType } from '$lib/types';
	import classNames from 'classnames';
	import PlayButton from '../PlayButton.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import LazyImg from '../LazyImg.svelte';
	import { Star } from 'radix-icons-svelte';
	import { openTitleModal } from '$lib/stores/modal.store';

	export let tmdbId: number | undefined = undefined;
	export let tvdbId: number | undefined = undefined;
	export let openInModal = true;
	export let jellyfinId: string = '';
	export let type: TitleType = 'movie';
	export let backdropUrl: string;

	export let title = '';
	export let subtitle = '';
	export let rating: number | undefined = undefined;
	export let progress = 0;

	export let size: 'dynamic' | 'md' | 'lg' | 'sm' = 'md';
	export let orientation: 'portrait' | 'landscape' = 'landscape';
</script>

<button
	on:click={() => {
		if (openInModal) {
			if (tmdbId) {
				openTitleModal({ type, id: tmdbId, provider: 'tmdb' });
			} else if (tvdbId) {
				openTitleModal({ type, id: tvdbId, provider: 'tvdb' });
			}
		} else {
			window.location.href = tmdbId || tvdbId ? `/${type}/${tmdbId || tvdbId}` : '#';
		}
	}}
	class={classNames(
		'relative flex shadow-lg rounded-xl selectable group hover:text-inherit flex-shrink-0 overflow-hidden text-left',
		{
			'aspect-video': orientation === 'landscape',
			'aspect-[2/3]': orientation === 'portrait',
			'w-32': size === 'sm' && orientation === 'portrait',
			'h-32': size === 'sm' && orientation === 'landscape',
			'w-44': size === 'md' && orientation === 'portrait',
			'h-44': size === 'md' && orientation === 'landscape',
			'w-60': size === 'lg' && orientation === 'portrait',
			'h-60': size === 'lg' && orientation === 'landscape',
			'w-full': size === 'dynamic'
		}
	)}
>
	<LazyImg src={backdropUrl} class="absolute inset-0 group-hover:scale-105 transition-transform" />
	<div
		class="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-black"
		style="filter: blur(50px); transform: scale(3);"
	>
		<LazyImg src={backdropUrl} />
	</div>
	<!-- <div
		style={`background-image: url(${backdropUrl}); background-size: cover; background-position: center; filter: blur(50px); transform: scale(3);`}
		class="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-black"
	/> -->
	<div
		class={classNames(
			'flex-1 flex flex-col justify-between bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity z-[1]',
			{
				'py-2 px-3': true
			}
		)}
	>
		<div class="flex justify-self-start justify-between">
			<slot name="top-left">
				<div>
					<h1 class="text-zinc-100 font-bold line-clamp-2 text-lg">{title}</h1>
					<h2 class="text-zinc-300 text-sm font-medium line-clamp-2">{subtitle}</h2>
				</div>
			</slot>
			<slot name="top-right">
				<div />
			</slot>
		</div>
		<div class="flex justify-self-end justify-between">
			<slot name="bottom-left">
				<div>
					{#if rating}
						<h2 class="flex items-center gap-1.5 text-sm text-zinc-300 font-medium">
							<Star />{rating.toFixed(1)}
						</h2>
					{/if}
				</div>
			</slot>
			<slot name="bottom-right">
				<div />
			</slot>
		</div>
	</div>
	<!-- <div
		class="absolute inset-0 bg-gradient-to-t from-darken group-hover:opacity-0 transition-opacity z-[1]"
	/> -->
	{#if jellyfinId}
		<div class="absolute inset-0 flex items-center justify-center z-[1]">
			<PlayButton
				on:click={(e) => {
					e.preventDefault();
					jellyfinId && playerState.streamJellyfinId(jellyfinId);
				}}
				class="sm:opacity-0 group-hover:opacity-100 transition-opacity"
			/>
		</div>
	{/if}
	{#if progress}
		<div
			class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 bg-gradient-to-t ease-in-out z-[1]"
		>
			<ProgressBar {progress} />
		</div>
	{/if}
</button>
