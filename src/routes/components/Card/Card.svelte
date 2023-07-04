<script lang="ts">
	import { formatMinutesToTime } from '$lib/utils';
	import classNames from 'classnames';
	import { TMDB_IMAGES } from '$lib/constants';
	import { Clock, Star } from 'radix-icons-svelte';

	export let tmdbId: string;
	export let title: string;
	export let genres: string[];
	export let runtimeMinutes: number;
	export let completionTime = '';
	export let backdropUrl: string;
	export let rating: number;

	export let available = true;
	export let progress = 0;
	export let progressType: 'watched' | 'downloading' = 'watched';
	export let large = false;
	export let randomProgress = false;
	if (randomProgress) {
		progress = Math.random() > 0.3 ? Math.random() * 100 : 0;
	}
</script>

<div
	class={classNames('rounded overflow-hidden relative shadow-2xl shrink-0', {
		'h-40 w-72': !large,
		'h-60 w-96': large
	})}
>
	<div style={'width: ' + progress + '%'} class="h-[2px] bg-zinc-200 bottom-0 absolute z-[1]" />
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		on:click={() => window.open('/movie/' + tmdbId, '_self')}
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

				{#if rating}
					<div class="flex gap-1.5 items-center">
						<Star />
						<div class="text-sm text-zinc-200">
							{rating.toFixed(1)}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
	<div
		style={"background-image: url('" + TMDB_IMAGES + backdropUrl + "')"}
		class="absolute inset-0 bg-center bg-cover peer-hover:scale-105 transition-transform"
	/>
	<div
		class={classNames('absolute inset-0 transition-opacity', {
			'bg-darken opacity-0 peer-hover:opacity-100': available,
			'bg-[#00000055] peer-hover:bg-darken': !available
		})}
	/>
</div>
