import { getTmdbSeries } from '$lib/apis/tmdb/tmdbApi';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		series: await getTmdbSeries(Number(params.id))
	};
}) satisfies PageLoad;
