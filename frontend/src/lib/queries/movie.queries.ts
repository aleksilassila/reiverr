import type {
	MovieRequestRuleDto,
	SetPreferenceDto,
	UpdatePlayStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { getUserId, reiverrApi } from '$lib/stores/user.store';
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
			queryFn: () => reiverrApi.users.getMovieUserData(getUserId(), tmdbId).then((r) => r.data)
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
			queryFn: () =>
				reiverrApi.requests.getMovieRequestRule(getUserId(), tmdbId).then((r) => r.data)
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

/** The progress of playback: the user data of the movie and the lists follow */
export async function saveMoviePlayState(tmdbId: string, playState: UpdatePlayStateDto) {
	await reiverrApi.users.updateMoviePlayState(getUserId(), tmdbId, playState);
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all);
}

export async function setMovieWatched(tmdbId: string, watched: boolean) {
	await reiverrApi.users.updateMoviePlayState(getUserId(), tmdbId, { watched });
	// The rule of the movie follows the watched state, so its status changes with it
	await invalidate(movieKeys.userData(tmdbId), movieKeys.status(tmdbId), catalogKeys.all);
}

export async function setMovieInMyList(tmdbId: string, inMyList: boolean) {
	await reiverrApi.myList.setMyListItem(getUserId(), tmdbId, { mediaType: 'movie', inMyList });
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all);
}

export async function setMovieRequested(tmdbId: string, requested: boolean) {
	await (requested
		? reiverrApi.requests.createMovieRequest(getUserId(), tmdbId)
		: reiverrApi.requests.deleteMovieRequest(getUserId(), tmdbId));
	// The lists show whether the user requested the title
	await invalidate(movieKeys.status(tmdbId), storageKeys.all, catalogKeys.all);
}

export async function updateMovieRequestRule(tmdbId: string, rule: MovieRequestRuleDto) {
	await reiverrApi.requests.updateMovieRequestRule(getUserId(), tmdbId, rule);
	await invalidate(movieKeys.rule(tmdbId), movieKeys.status(tmdbId));
}

/** Selects a release or a file for the movie */
export async function setMoviePreference(tmdbId: string, preference: SetPreferenceDto) {
	await reiverrApi.requests.setMoviePreference(getUserId(), tmdbId, preference);
	await invalidate(movieKeys.status(tmdbId));
}

export async function clearMoviePreference(tmdbId: string) {
	await reiverrApi.requests.clearMoviePreference(getUserId(), tmdbId);
	await invalidate(movieKeys.status(tmdbId));
}
