import type { PageLoad } from './$types';
import { fetchFullMovieDetails, TmdbApi } from '$lib/tmdb-api';
import { RadarrApi } from '$lib/radarr/radarr';

export const load = (async ({ params }) => {
	return {
		movie: await RadarrApi.get('/api/v3/movie', {
			params: {
				query: {
					tmdbId: Number(params.id)
				}
			}
		}).then((res) => res.data?.[0]),
		remoteMovie: fetchFullMovieDetails(params.id)
	};
}) satisfies PageLoad;
