<script lang="ts">
	import type { TmdbMovie, TmdbMovieFull } from '$lib/tmdb-api';
	import { formatGenres, formatMinutes } from '$lib/utils';
	import classNames from 'classnames';
	import { TMDB_IMAGES } from '$lib/constants';
	import { onMount } from 'svelte';
	import { fetchTmdbMovie, fetchTmdbMovieImages, TmdbApi } from '$lib/tmdb-api';
	import CardPlaceholder from './CardPlaceholder.svelte';

	export let tmdbId: string;

	export let available = true;
	export let progress = 0;
	export let progressType: 'watched' | 'downloading' = 'watched';
	export let randomProgress = false;
	if (randomProgress) {
		progress = Math.random() > 0.3 ? Math.random() * 100 : 0;
	}

	let tmdbMovie: TmdbMovie;
	let backdropUrl;

	onMount(async () => {
		if (!tmdbId) return;

		fetchTmdbMovieImages(String(tmdbId))
			.then(
				(r) =>
					(backdropUrl = TMDB_IMAGES + r.backdrops.filter((b) => b.iso_639_1 === 'en')[0].file_path)
			)
			.catch((err) => (backdropUrl = null));
		fetchTmdbMovie(tmdbId).then((movie) => (tmdbMovie = movie));
	});
</script>

{#if !tmdbMovie || !backdropUrl}
	<CardPlaceholder />
{:else}
	<div
		style={"background-image: url('" + backdropUrl + "')"}
		class="bg-center bg-cover h-40 w-72 rounded overflow-hidden relative drop-shadow-2xl"
	>
		<div style={'width: ' + progress + '%'} class="h-[2px] bg-zinc-200 bottom-0 absolute z-[1]" />
		<div
			on:click={() => window.open('/movie/' + tmdbMovie.id, '_self')}
			class="h-full w-full opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between cursor-pointer p-2 px-3 relative z-[1] peer"
			style={progress > 0 ? 'padding-bottom: 0.6rem;' : ''}
		>
			<div>
				<h1 class="font-bold tracking-wider">{tmdbMovie.original_title}</h1>
				<div class="text-xs text-zinc-300 tracking-wider font-medium">
					{formatGenres(tmdbMovie.genres)}
				</div>
			</div>
			<div class="flex justify-between items-end">
				{#if progressType === 'watched'}
					<div class="text-xs font-medium text-zinc-200">
						{progress
							? formatMinutes(tmdbMovie.runtime - tmdbMovie.runtime * (progress / 100)) + ' left'
							: formatMinutes(tmdbMovie.runtime)}
					</div>
				{:else if progressType === 'downloading'}
					<div class="text-xs font-medium text-zinc-200">
						{Math.floor(progress) + '% Downloaded'}
					</div>
				{/if}
			</div>
		</div>
		<div
			class={classNames('absolute inset-0', {
				'bg-darken opacity-0 peer-hover:opacity-100': available,
				'bg-[#00000055] peer-hover:bg-darken': !available
			})}
		/>
	</div>
{/if}
