import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { invalidate, type MediaType } from './query-client';

const HOUR = 3_600_000;

export const metadataKeys = {
	/** Every TMDB document: what clearing the cache invalidates */
	all: ['metadata'] as const,
	title: (mediaType: MediaType, tmdbId: string) => [...metadataKeys.all, mediaType, tmdbId] as const
};

export const metadataQueries = {
	/** The TMDB document of the series, with every season */
	series: (tmdbId: string) =>
		queryOptions({
			queryKey: metadataKeys.title('series', tmdbId),
			queryFn: () => reiverrApi.metadata.getSeries(tmdbId).then((r) => r.data.tmdbSeries),
			staleTime: HOUR
		}),
	/** The TMDB document of the movie */
	movie: (tmdbId: string) =>
		queryOptions({
			queryKey: metadataKeys.title('movie', tmdbId),
			queryFn: () => reiverrApi.metadata.getMovie(tmdbId).then((r) => r.data.tmdbMovie),
			staleTime: HOUR
		})
};

/** The TMDB documents of the series and movies are fetched again */
export async function clearMetadataCache() {
	await reiverrApi.metadata.clearCache();
	await invalidate(metadataKeys.all);
}
