import { getTmdbSeries, getTmdbSeriesFromTvdbId } from '$lib/apis/tmdb/tmdbApi';
import { sonarrSeriesStore } from '$lib/stores/data.store';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	const sonarrItem = await sonarrSeriesStore.promise.then((series) =>
		series.find((s) => s.tvdbId === Number(params.id))
	);

	if (sonarrItem) {
		const tmdbSeries = await getTmdbSeriesFromTvdbId(params.id);

		return {
			tmdbId: tmdbSeries?.id,
			name: tmdbSeries?.name
		};
	} else {
		const tmdbSeries = await getTmdbSeries(Number(params.id));

		return {
			tmdbId: tmdbSeries?.id,
			name: tmdbSeries?.name
		};
	}
}) satisfies PageLoad;
