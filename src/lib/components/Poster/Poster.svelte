<script lang="ts">
	import { TMDB_POSTER_SMALL } from '$lib/constants';
	import type { TitleType } from '$lib/types';
	import classNames from 'classnames';
	import PlayButton from '../PlayButton.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';

	export let tmdbId: number;
	export let jellyfinId: string = '';
	export let type: TitleType = 'movie';
	export let backdropUrl: string;

	export let title = '';
	export let subtitle = '';

	export let progress = 0;
</script>

<a
	href={`/${type}/${tmdbId}`}
	style={"background-image: url('" + backdropUrl + "');"}
	class="relative flex shadow-lg rounded-lg aspect-[2/3] bg-center bg-cover w-44 selectable group hover:text-inherit flex-shrink-0"
>
	<div
		class={classNames(
			'flex-1 flex flex-col justify-between bg-darken opacity-0 group-hover:opacity-100 transition-opacity',
			{
				'py-2 px-3': true
				// 'pb-4': progress,
				// 'pb-2': !progress
			}
		)}
	>
		<div class="flex justify-self-start justify-between">
			<slot name="top-left">
				<div>
					<h1 class="font-semibold line-clamp-2">{title}</h1>
					<h2 class="text-zinc-300 text-sm font-medium line-clamp-2">{subtitle}</h2>
				</div>
			</slot>
			<slot name="top-right">
				<div />
			</slot>
		</div>
		<div class="flex justify-self-end justify-between">
			<slot name="bottom-left">
				<div />
			</slot>
			<slot name="bottom-right">
				<div />
			</slot>
		</div>
	</div>
	<div
		class="absolute inset-0 bg-gradient-to-t from-darken group-hover:opacity-0 transition-opacity"
	/>
	<div class="absolute inset-0 flex items-center justify-center">
		<PlayButton
			on:click={(e) => {
				e.preventDefault();
				jellyfinId && playerState.streamJellyfinId(jellyfinId);
			}}
			class="sm:opacity-0 group-hover:opacity-100 transition-opacity"
		/>
	</div>
	{#if progress}
		<div
			class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 group-hover:opacity-0 transition-opacity bg-gradient-to-t ease-in-out"
		>
			<ProgressBar {progress} />
		</div>
	{/if}
</a>
