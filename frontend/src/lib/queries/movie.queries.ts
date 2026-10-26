import type {
	MovieRequestRuleDto,
	SetPreferenceDto,
	UpdatePlayStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { invalidate } from './query-client';
import { storageKeys } from './storage.queries';

const HOUR = 3_600_000;

export const movieKeys = {
	/** Every movie: what a change on the server's files invalidates */
	all: ['movie'] as const,
	/** Everything of the movie */
	title: (tmdbId: string) => ['movie', tmdbId] as const,
	metadata: (tmdbId: string) => ['movie', tmdbId, 'metadata'] as const,
	userData: (tmdbId: string) => ['movie', tmdbId, 'user-data'] as const,
	status: (tmdbId: string) => ['movie', tmdbId, 'status'] as const,
	rule: (tmdbId: string) => ['movie', tmdbId, 'rule'] as const,
	files: (tmdbId: string) => ['movie', tmdbId, 'files'] as const,
	releases: (tmdbId: string) => ['movie', tmdbId, 'releases'] as const
};

export const movieQueries = {
	/** The TMDB document of the movie */
	metadata: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.metadata(tmdbId),
			queryFn: () => reiverrApi.metadata.getMovie(tmdbId).then((r) => r.data.tmdbMovie),
			staleTime: HOUR
		}),
	/** Whether the movie is in my list, and the play state of the user */
	userData: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.userData(tmdbId),
			queryFn: () => reiverrApi.users.getMovieUserData(tmdbId).then((r) => r.data)
		}),
	/** Where the request of the user stands, its preference, and the torrents on the server */
	status: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.status(tmdbId),
			queryFn: () => reiverrApi.library.getMovieStatus(tmdbId).then((r) => r.data)
		}),
	/** How long the request of the user keeps the movie after it was watched */
	rule: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.rule(tmdbId),
			queryFn: () => reiverrApi.requests.getMovieRequestRule(tmdbId).then((r) => r.data)
		}),
	/** The files of the movie in the library, external or imported */
	files: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.files(tmdbId),
			queryFn: () => reiverrApi.library.getMovieFiles(tmdbId).then((r) => r.data)
		}),
	/** What the indexers have for the movie; searched again on every view */
	releases: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.releases(tmdbId),
			queryFn: () => reiverrApi.indexers.searchMovieReleases(tmdbId).then((r) => r.data),
			staleTime: 0
		})
};

/**
 * The progress of playback: the user data of the movie and the lists follow, and the usage,
 * since a save past the end marks the movie watched
 */
export async function saveMoviePlayState(tmdbId: string, playState: UpdatePlayStateDto) {
	await reiverrApi.users.updateMoviePlayState(tmdbId, playState);
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all, storageKeys.all);
}

export async function setMovieWatched(tmdbId: string, watched: boolean) {
	await reiverrApi.users.updateMoviePlayState(tmdbId, { watched });
	// The rule of the movie follows the watched state, so its status changes with it, and the
	// usage when the rule deletes the watched request
	await invalidate(
		movieKeys.userData(tmdbId),
		movieKeys.status(tmdbId),
		catalogKeys.all,
		storageKeys.all
	);
}

export async function setMovieInMyList(tmdbId: string, inMyList: boolean) {
	await reiverrApi.myList.setMyListItem(tmdbId, { mediaType: 'movie', inMyList });
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all);
}

export async function setMovieRequested(tmdbId: string, requested: boolean) {
	await (requested
		? reiverrApi.requests.createMovieRequest(tmdbId)
		: reiverrApi.requests.deleteMovieRequest(tmdbId));
	// The lists show whether the user requested the title
	await invalidate(movieKeys.status(tmdbId), storageKeys.all, catalogKeys.all);
}

export async function updateMovieRequestRule(tmdbId: string, rule: MovieRequestRuleDto) {
	await reiverrApi.requests.updateMovieRequestRule(tmdbId, rule);
	// The usage lists the rule of the title, which may also delete the watched request
	await invalidate(movieKeys.rule(tmdbId), movieKeys.status(tmdbId), storageKeys.all);
}

/** Selects a release or a file for the movie */
export async function setMoviePreference(tmdbId: string, preference: SetPreferenceDto) {
	await reiverrApi.requests.setMoviePreference(tmdbId, preference);
	// What the request has and downloads, and so what it takes, follows the source
	await invalidate(movieKeys.status(tmdbId), storageKeys.all);
}

export async function clearMoviePreference(tmdbId: string) {
	await reiverrApi.requests.clearMoviePreference(tmdbId);
	await invalidate(movieKeys.status(tmdbId), storageKeys.all);
}
