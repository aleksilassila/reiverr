import type { PageLoad } from './$types';
import { fetchFullMovieDetails, TmdbApi } from '$lib/tmdb-api';
import { RadarrApi } from '$lib/radarr/radarr';

export const load = (async () => {
	const movies = await TmdbApi.get('/movie/popular').then((res) => res.data.results.slice(0, 5));

	const showcases = await Promise.all(movies.map((m: any) => fetchFullMovieDetails(m.id)));
	return { showcases };
}) satisfies PageLoad;
