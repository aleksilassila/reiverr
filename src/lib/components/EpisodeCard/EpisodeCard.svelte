<script lang="ts">
	import { TMDB_IMAGES } from '$lib/constants';
	import { TriangleRight } from 'radix-icons-svelte';
	import IconButton from '../IconButton.svelte';
	import classNames from 'classnames';

	export let backdropPath: string;
	export let title: string;
	export let subtitle: string;
	export let episodeTag: string | undefined = undefined;
	export let runtime: number;

	export let size: 'md' | 'dynamic' = 'md';
</script>

<div
	class={classNames(
		'aspect-video bg-center bg-cover bg-no-repeat rounded-lg overflow-hidden transition-all cursor-pointer group shadow-lg relative',
		{
			'h-40': size === 'md',
			'h-full': size === 'dynamic'
		}
	)}
	style={"background-image: url('" + TMDB_IMAGES + backdropPath + "');"}
>
	<div
		class="opacity-100 group-hover:opacity-0 flex flex-col justify-between p-2 lg:p-3 lg:px-3 bg-darken h-full transition-opacity"
	>
		<div class="flex justify-between items-center text-xs lg:text-sm font-medium text-zinc-300">
			<div>
				<slot name="episode-tag">
					{episodeTag}
				</slot>
			</div>
			<div>
				{runtime} min
			</div>
		</div>
		<div>
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
			<IconButton>
				<TriangleRight size={30} />
			</IconButton>
		</div>
	</div>
</div>
