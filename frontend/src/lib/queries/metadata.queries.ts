import { reiverrApi } from '$lib/stores/user.store';
import { movieKeys } from './movie.queries';
import { invalidate } from './query-client';
import { seriesKeys } from './series.queries';

/** The TMDB documents of the series and movies are fetched again */
export async function clearMetadataCache() {
	await reiverrApi.metadata.clearCache();
	await invalidate(seriesKeys.all, movieKeys.all);
}
