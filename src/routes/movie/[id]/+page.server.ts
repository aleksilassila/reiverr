import { getTmdbMovie } from '$lib/apis/tmdb/tmdbApi';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		movie: await getTmdbMovie(Number(params.id))
	};
}) satisfies PageServerLoad;
