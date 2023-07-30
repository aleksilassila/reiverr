<script lang="ts">
	import { formatMinutesToTime } from '$lib/utils';
	import classNames from 'classnames';
	import { TMDB_IMAGES } from '$lib/constants';
	import { Clock, Star } from 'radix-icons-svelte';

	export let tmdbId: number;
	export let type: 'movie' | 'series' = 'movie';
	export let title: string;
	export let genres: string[] = [];
	export let runtimeMinutes = 0;
	export let seasons = 0;
	export let completionTime = '';
	export let backdropUri: string;
	export let rating: number;

	export let available = true;
	export let progress = 0;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let randomProgress = false;
	if (randomProgress) {
		progress = Math.random() > 0.3 ? Math.random() * 100 : 0;
	}
</script>

<a
	class={classNames(
		'rounded overflow-hidden relative shadow-lg shrink-0 aspect-video selectable block hover:text-inherit',
		{
			'h-40': size === 'md',
			'h-60': size === 'lg',
			'w-full': size === 'dynamic'
		}
	)}
	href={`/${type}/${tmdbId}`}
>
	<div style={'width: ' + progress + '%'} class="h-[2px] bg-zinc-200 bottom-0 absolute z-[1]" />
	<div
		class="h-full w-full opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between cursor-pointer p-2 px-3 relative z-[1] peer"
		style={progress > 0 ? 'padding-bottom: 0.6rem;' : ''}
	>
		<div>
			<h1 class="font-bold tracking-wider text-lg">{title}</h1>
			<div class="text-xs text-zinc-300 tracking-wider font-medium">
				{genres.map((genre) => genre.charAt(0).toUpperCase() + genre.slice(1)).join(', ')}
			</div>
		</div>
		<div class="flex justify-between items-end">
			{#if completionTime}
				<div class="text-sm font-medium text-zinc-200 tracking-wide">
					Downloaded in <b
						>{formatMinutesToTime((new Date(completionTime).getTime() - Date.now()) / 1000 / 60)}</b
					>
				</div>
			{:else}
				{#if runtimeMinutes}
					<div class="flex gap-1.5 items-center">
						<Clock />
						<div class="text-sm text-zinc-200">
							{progress
								? formatMinutesToTime(runtimeMinutes - runtimeMinutes * (progress / 100)) + ' left'
								: formatMinutesToTime(runtimeMinutes)}
						</div>
					</div>
				{/if}
				{#if seasons}
					<div class="text-sm text-zinc-200">
						{seasons} Season{seasons > 1 ? 's' : ''}
					</div>
				{/if}

				<div class="flex gap-1.5 items-center">
					<Star />
					<div class="text-sm text-zinc-200">
						{rating ? rating.toFixed(1) : 'N/A'}
					</div>
				</div>
			{/if}
		</div>
	</div>
	<div
		style={"background-image: url('" + TMDB_IMAGES + backdropUri + "')"}
		class="absolute inset-0 bg-center bg-cover peer-hover:scale-105 transition-transform"
	/>
	<div
		class={classNames('absolute inset-0 transition-opacity', {
			'bg-darken opacity-0 peer-hover:opacity-100': available,
			'bg-[#00000055] peer-hover:bg-darken': !available
		})}
	/>
</a>
