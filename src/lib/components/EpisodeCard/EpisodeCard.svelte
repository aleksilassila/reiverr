<script lang="ts">
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import classNames from 'classnames';
	import { Check, CheckCircled, DotsHorizontal, TriangleRight } from 'radix-icons-svelte';
	import { fade } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import { onMount } from 'svelte';

	export let backdropPath: string;

	export let title = '';
	export let subtitle = '';
	export let episodeNumber: string | undefined = undefined;
	export let runtime = 0;
	export let progress = 0;
	export let watched = false;

	export let handlePlay: (() => void) | undefined = undefined;

	export let size: 'md' | 'dynamic' = 'md';
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<button
	on:click
	class={classNames(
		'aspect-video bg-center bg-cover bg-no-repeat rounded-lg overflow-hidden transition-all shadow-lg relative cursor-pointer selectable flex-shrink-0',
		{
			'h-40': size === 'md',
			'h-full': size === 'dynamic',
			group: !!handlePlay
		}
	)}
	style={"background-image: url('" + TMDB_BACKDROP_SMALL + backdropPath + "');"}
	in:fade|global={{ duration: 100, delay: 100 }}
	out:fade|global={{ duration: 100 }}
>
	<div
		class={classNames('flex flex-col justify-between h-full group-hover:opacity-0 transition-all', {
			'px-2 lg:px-3 pt-2': true,
			'pb-4 lg:pb-6': progress,
			'pb-2': !progress,
			'bg-gradient-to-t from-darken': !!handlePlay,
			'bg-darken': !handlePlay || watched
		})}
	>
		<div class="flex justify-between items-center">
			<div>
				<slot name="left-top">
					{#if episodeNumber}
						<p class="text-xs lg:text-sm font-medium text-zinc-300">{episodeNumber}</p>
					{/if}
				</slot>
			</div>
			<div>
				<slot name="right-top">
					{#if runtime}
						<p class="text-xs lg:text-sm font-medium text-zinc-300">
							{runtime} min
						</p>
					{/if}
				</slot>
			</div>
		</div>
		<div class="flex items-end justify-between">
			<slot name="left-bottom">
				<div class="flex flex-col items-start">
					{#if subtitle}
						<div class="text-zinc-300 text-sm font-medium">{subtitle}</div>
					{/if}
					{#if title}
						<div class="font-medium text-left">
							{title}
						</div>
					{/if}
				</div>
			</slot>
			<slot name="right-bottom">
				{#if watched}
					<Check size={20} class="opacity-80" />
				{/if}
			</slot>
		</div>
	</div>
	<div class="absolute inset-0 flex items-center justify-center">
		<div
			class="backdrop-blur-lg rounded-full p-1 bg-[#00000044] opacity-0 group-hover:opacity-100 transition-opacity"
		>
			<IconButton on:click={handlePlay}>
				<TriangleRight size={30} />
			</IconButton>
		</div>
	</div>
	{#if progress}
		<div
			class="absolute h-1 bg-zinc-300 bg-opacity-50 bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 rounded-full overflow-hidden group-hover:opacity-0 transition-opacity"
		>
			<div style={'width: ' + progress + '%'} class="h-full bg-zinc-200" />
		</div>
	{/if}
</button>
