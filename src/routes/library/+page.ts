import type { PageLoad } from './$types';
import { radarrApi } from '$lib/servarr-api';
import { fetchMovieDetails } from '$lib/tmdb-api';

export const load = (async () => {
	const radarrMovies = await radarrApi
		.get('/api/v3/movie', {
			params: {}
		})
		.then((r) => r.data);

	let tmdbMovies;
	if (radarrMovies) {
		tmdbMovies = await Promise.all(
			radarrMovies.filter((m) => m.tmdbId).map((m) => fetchMovieDetails(m.tmdbId as any))
		);
	}

	console.log('radarrMovies', radarrMovies);

	return {
		radarrMovies,
		tmdbMovies,
		downloading: await radarrApi
			.get('/api/v3/queue', {
				params: {
					query: {
						includeMovie: true
					}
				}
			})
			.then((r) => r.data?.records)
	};
}) satisfies PageLoad;
