import type { PageLoad } from './$types';
import { fetchFullMovieDetails } from '$lib/tmdb-api';
import { RadarrApi } from '$lib/radarr/radarr';

export const load = (async () => {
	const radarrMovies = await RadarrApi.get('/api/v3/movie', {
		params: {}
	}).then((r) => r.data);

	let tmdbMovies;
	if (radarrMovies) {
		tmdbMovies = await Promise.all(
			radarrMovies.filter((m) => m.tmdbId).map((m) => fetchFullMovieDetails(String(m.tmdbId)))
		);
	}

	console.log('radarrMovies', radarrMovies);

	return {
		radarrMovies,
		tmdbMovies,
		downloading: await RadarrApi.get('/api/v3/queue', {
			params: {
				query: {
					includeMovie: true
				}
			}
		}).then((r) => r.data?.records)
	};
}) satisfies PageLoad;
