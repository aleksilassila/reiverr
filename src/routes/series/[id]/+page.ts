import { getTmdbSeries } from '$lib/apis/tmdb/tmdbApi';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	const tmdbSeries = await getTmdbSeries(Number(params.id));

	return {
		tmdbId: params.id,
		name: tmdbSeries?.name
	};
}) satisfies PageLoad;
