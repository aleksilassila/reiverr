import type { UpdatePlayStateDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { invalidate, type MediaType } from './query-client';
import { requestsChangedKeys } from './requests.queries';
import { storageKeys } from './storage.queries';

export const userDataKeys = {
	title: (mediaType: MediaType, tmdbId: string) => ['user-data', mediaType, tmdbId] as const
};

export const userDataQueries = {
	/** Whether the series is in my list, and the play states of the user */
	series: (tmdbId: string) =>
		queryOptions({
			queryKey: userDataKeys.title('series', tmdbId),
			queryFn: () => reiverrApi.userData.getSeriesUserData(tmdbId).then((r) => r.data)
		}),
	/** Whether the movie is in my list, and the play state of the user */
	movie: (tmdbId: string) =>
		queryOptions({
			queryKey: userDataKeys.title('movie', tmdbId),
			queryFn: () => reiverrApi.userData.getMovieUserData(tmdbId).then((r) => r.data)
		})
};

/**
 * The progress of playback: the user data of the title and the lists follow, and the usage, since
 * a save past the end marks it watched
 */
const progressChanged = (mediaType: MediaType, tmdbId: string) =>
	invalidate(userDataKeys.title(mediaType, tmdbId), catalogKeys.all, storageKeys.all);

/**
 * The rule of the title follows the watched state, so its requests and their status change with
 * it, and the usage when the rule deletes watched requests
 */
const watchedChanged = (mediaType: MediaType, tmdbId: string) =>
	invalidate(userDataKeys.title(mediaType, tmdbId), ...requestsChangedKeys(mediaType, tmdbId));

const myListChanged = (mediaType: MediaType, tmdbId: string) =>
	invalidate(userDataKeys.title(mediaType, tmdbId), catalogKeys.all);

export async function saveEpisodePlayState(
	tmdbId: string,
	season: number,
	episode: number,
	playState: UpdatePlayStateDto
) {
	await reiverrApi.userData.updateEpisodePlayState(tmdbId, season, episode, playState);
	await progressChanged('series', tmdbId);
}

export async function saveMoviePlayState(tmdbId: string, playState: UpdatePlayStateDto) {
	await reiverrApi.userData.updateMoviePlayState(tmdbId, playState);
	await progressChanged('movie', tmdbId);
}

export async function setEpisodeWatched(
	tmdbId: string,
	season: number,
	episode: number,
	watched: boolean
) {
	await reiverrApi.userData.updateEpisodePlayState(tmdbId, season, episode, { watched });
	await watchedChanged('series', tmdbId);
}

export async function setEpisodesWatched(
	tmdbId: string,
	playStates: { season: number; episode: number; watched: boolean }[]
) {
	await reiverrApi.userData.updateSeriesPlayStates(tmdbId, { playStates });
	await watchedChanged('series', tmdbId);
}

export async function setMovieWatched(tmdbId: string, watched: boolean) {
	await reiverrApi.userData.updateMoviePlayState(tmdbId, { watched });
	await watchedChanged('movie', tmdbId);
}

export async function setSeriesInMyList(tmdbId: string, inMyList: boolean) {
	await (inMyList
		? reiverrApi.userData.addSeriesToMyList(tmdbId)
		: reiverrApi.userData.removeSeriesFromMyList(tmdbId));
	await myListChanged('series', tmdbId);
}

export async function setMovieInMyList(tmdbId: string, inMyList: boolean) {
	await (inMyList
		? reiverrApi.userData.addMovieToMyList(tmdbId)
		: reiverrApi.userData.removeMovieFromMyList(tmdbId));
	await myListChanged('movie', tmdbId);
}
