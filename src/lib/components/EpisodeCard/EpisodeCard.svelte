<script lang="ts">
	import { TMDB_IMAGES } from '$lib/constants';
	import classNames from 'classnames';
	import { TriangleRight } from 'radix-icons-svelte';
	import IconButton from '../IconButton.svelte';

	export let backdropPath: string;
	export let title: string;
	export let subtitle: string;
	export let episodeNumber: string | undefined = undefined;
	export let runtime: number;
	export let progress = 0;
	export let handlePlay: (() => void) | undefined = undefined;

	export let size: 'md' | 'dynamic' = 'md';
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
	class={classNames(
		'aspect-video bg-center bg-cover bg-no-repeat rounded-lg overflow-hidden transition-all shadow-lg relative cursor-pointer selectable',
		{
			'h-40': size === 'md',
			'h-full': size === 'dynamic',
			group: !!handlePlay
		}
	)}
	tabindex="0"
	style={"background-image: url('" + TMDB_IMAGES + backdropPath + "');"}
>
	<div
		class="opacity-100 group-hover:opacity-0 flex flex-col justify-between p-2 lg:p-3 lg:px-3 bg-darken h-full transition-opacity"
	>
		<div
			class={classNames(
				'flex justify-between items-center text-xs lg:text-sm font-medium text-zinc-300',
				{
					'opacity-60': !handlePlay
				}
			)}
		>
			<div>
				<slot name="left-info">
					{episodeNumber}
				</slot>
			</div>
			<div>
				<slot name="right-info">
					{runtime} min
				</slot>
			</div>
		</div>
		<div
			class={classNames({
				'opacity-60': !handlePlay
			})}
		>
			<div class="text-xs lg:text-sm text-zinc-300 font-medium tracking-wide">{subtitle}</div>
			<div class="font-semibold lg:text-lg">
				{title}
			</div>
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
	<div style={'width: ' + progress + '%'} class="h-[2px] bg-zinc-200 bottom-0 absolute z-[1]" />
</div>
