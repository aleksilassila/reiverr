import { fetchTmdbMovie } from '$lib/apis/tmdbApi';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		movie: await fetchTmdbMovie(params.id)
	};
}) satisfies PageServerLoad;
