import type { PageLoad } from './$types';
import { radarrApi } from '$lib/servarr-api';
import { fetchMovieDetails, TmdbApi } from '$lib/tmdb-api';

export const load = (async ({ params }) => {
	return {
		movie: await radarrApi
			.get('/api/v3/movie', {
				params: {
					query: {
						tmdbId: Number(params.id)
					}
				}
			})
			.then((res) => res.data?.[0]),
		remoteMovie: fetchMovieDetails(params.id)
	};
}) satisfies PageLoad;
