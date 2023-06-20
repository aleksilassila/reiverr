import { fetchTmdbMovie } from '$lib/tmdb-api';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		movie: await fetchTmdbMovie(params.id)
	};
}) satisfies PageServerLoad;
