import type { IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { invalidate } from './query-client';

export const indexersKeys = {
	all: ['indexers'] as const,
	list: () => [...indexersKeys.all, 'list'] as const,
	seriesReleases: (tmdbId: string, season: number, episode: number | undefined) =>
		[...indexersKeys.all, 'releases', 'series', tmdbId, season, episode ?? null] as const,
	movieReleases: (tmdbId: string) => [...indexersKeys.all, 'releases', 'movie', tmdbId] as const
};

export const indexersQueries = {
	list: () =>
		queryOptions({
			queryKey: indexersKeys.list(),
			queryFn: () => reiverrApi.indexers.getIndexers().then((r) => r.data.indexers)
		}),
	/** What the indexers have for the episode, or the season packs without one; searched again on every view */
	seriesReleases: (tmdbId: string, season: number, episode: number | undefined) =>
		queryOptions({
			queryKey: indexersKeys.seriesReleases(tmdbId, season, episode),
			queryFn: () =>
				reiverrApi.indexers.searchSeriesReleases(tmdbId, { season, episode }).then((r) => r.data),
			staleTime: 0
		}),
	/** What the indexers have for the movie; searched again on every view */
	movieReleases: (tmdbId: string) =>
		queryOptions({
			queryKey: indexersKeys.movieReleases(tmdbId),
			queryFn: () => reiverrApi.indexers.searchMovieReleases(tmdbId).then((r) => r.data),
			staleTime: 0
		})
};

export async function updateIndexers(indexers: IndexerDto[]) {
	await reiverrApi.indexers.updateIndexers({ indexers });
	await invalidate(indexersKeys.list());
}
