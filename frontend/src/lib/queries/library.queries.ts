import type {
	FulfilmentStatusDto,
	LibrarySettingsDto,
	MediaFileDto,
	SeriesStatusDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions, skipToken } from '@tanstack/svelte-query';
import { queryClient, type MediaType } from './query-client';

export const libraryKeys = {
	/** Everything of the library: what a change on the server's files invalidates */
	all: ['library'] as const,
	settings: () => [...libraryKeys.all, 'settings'] as const,
	/** The status of the requests and the files of a title: what the jobs of the server change */
	status: (mediaType: MediaType, tmdbId: string) =>
		[...libraryKeys.all, 'status', mediaType, tmdbId] as const,
	/** Every file list of a title: what a change of its files invalidates */
	files: (mediaType: MediaType, tmdbId: string) =>
		[...libraryKeys.all, 'files', mediaType, tmdbId] as const,
	episodeFiles: (tmdbId: string, season: number, episode: number | undefined) =>
		[...libraryKeys.files('series', tmdbId), season, episode ?? null] as const
};

/** The status document */
export type SeriesStatus = {
	/** How the library fulfils the requests of the current user, by the id of the request */
	fulfilments: Map<string, FulfilmentStatusDto>;
	/** The files of the series in the index */
	files: MediaFileDto[];
};

function toSeriesStatus(status: SeriesStatusDto): SeriesStatus {
	return {
		fulfilments: new Map(status.fulfilments.map((f) => [f.requestId, f])),
		files: status.files
	};
}

export const libraryQueries = {
	/** The library folders, the cleanup schedule and the disk limit */
	settings: () =>
		queryOptions({
			queryKey: libraryKeys.settings(),
			queryFn: () => reiverrApi.library.getLibrarySettings().then((r) => r.data)
		}),
	/** How the library fulfils the requests of the user, and the files of the series */
	seriesStatus: (tmdbId: string) =>
		queryOptions({
			queryKey: libraryKeys.status('series', tmdbId),
			queryFn: () => reiverrApi.library.getSeriesStatus(tmdbId).then((r) => r.data),
			select: toSeriesStatus
		}),
	/** How the library fulfils the request of the user, and the files of the movie */
	movieStatus: (tmdbId: string) =>
		queryOptions({
			queryKey: libraryKeys.status('movie', tmdbId),
			queryFn: () => reiverrApi.library.getMovieStatus(tmdbId).then((r) => r.data)
		}),
	/** The files of the episode on disk, with their subtitles, for the player; nothing without an episode */
	episodeFiles: (tmdbId: string, season: number, episode: number | undefined) =>
		queryOptions({
			queryKey: libraryKeys.episodeFiles(tmdbId, season, episode),
			queryFn:
				episode === undefined
					? skipToken
					: () => reiverrApi.library.getEpisodeFiles(tmdbId, season, episode).then((r) => r.data)
		}),
	/** The files of the movie on disk, with their subtitles, for the player */
	movieFiles: (tmdbId: string) =>
		queryOptions({
			queryKey: libraryKeys.files('movie', tmdbId),
			queryFn: () => reiverrApi.library.getMovieFiles(tmdbId).then((r) => r.data)
		})
};

/** With `force`, the indexed files of a removed folder are forgotten */
export async function updateLibrarySettings(settings: LibrarySettingsDto, force = false) {
	const saved = await reiverrApi.library
		.updateLibrarySettings(settings, force ? { force } : undefined)
		.then((r) => r.data);
	queryClient.setQueryData(libraryKeys.settings(), saved);
	return saved;
}
