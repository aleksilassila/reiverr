<script lang="ts">
	import type { TmdbMovie } from '$lib/apis/tmdbApi';
	import { onMount } from 'svelte';
	import { fetchTmdbMovie, fetchTmdbMovieImages } from '$lib/apis/tmdbApi';
	import { TMDB_IMAGES } from '$lib/constants';
	import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';
	import CardPlaceholder from './CardPlaceholder.svelte';
	import Card from './Card.svelte';

	export let tmdbId: string;

	export let type: 'default' | 'download' | 'in-library' = 'default';

	let tmdbMoviePromise: Promise<TmdbMovie>;
	let jellyfinItemPromise;
	let radarrItemPromise;
	let backdropUrlPromise;

	onMount(async () => {
		if (!tmdbId) throw new Error('No tmdbId provided');

		backdropUrlPromise = fetchTmdbMovieImages(String(tmdbId)).then(
			(r) => TMDB_IMAGES + r.backdrops.filter((b) => b.iso_639_1 === 'en')[0].file_path
		);
		tmdbMoviePromise = fetchTmdbMovie(tmdbId);
		if (type === 'in-library') jellyfinItemPromise = getJellyfinItemByTmdbId(tmdbId);
		if (type === 'download')
			radarrItemPromise = fetch(`/movie/${tmdbId}/radarr`).then((r) => r.json());
	});
</script>

{#await Promise.all([tmdbMoviePromise, jellyfinItemPromise, backdropUrlPromise])}
	<CardPlaceholder {...$$restProps} />
{:then [tmdbMovie, jellyfinItem, backdropUrl]}
	<Card {...$$restProps} {tmdbMovie} {backdropUrl} {jellyfinItem} />
{:catch err}
	Error
{/await}
