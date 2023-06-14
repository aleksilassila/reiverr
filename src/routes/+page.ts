import type { PageLoad } from './$types';
import { radarrApi } from '$lib/servarr-api';
import { fetchMovieDetails, TmdbApi } from '$lib/tmdb-api';

export const load = (async () => {
	const movies = await TmdbApi.get('/movie/popular').then((res) => res.data.results.slice(0, 5));

	console.log('movies', movies);
	const showcases = await Promise.all(movies.map((m: any) => fetchMovieDetails(m.id)));
	console.log('showcases: ', showcases);
	return { showcases };
}) satisfies PageLoad;
