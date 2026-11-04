import type {
	MovieRequestRuleDto,
	MovieRequestsDto,
	MovieStatusDto,
	SetPreferenceDto,
	UpdatePlayStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { invalidate } from './query-client';
import {
	getStatusLabel,
	heldFileOf,
	isErrorStatus,
	torrentItemOf,
	liveRefetchInterval,
	type TitleTorrents,
	toTitleTorrents
} from './request-status';
import { storageKeys } from './storage.queries';

const HOUR = 3_600_000;

export const movieKeys = {
	/** Every movie: what a change on the server's files invalidates */
	all: ['movie'] as const,
	/** Everything of the movie */
	title: (tmdbId: string) => ['movie', tmdbId] as const,
	metadata: (tmdbId: string) => ['movie', tmdbId, 'metadata'] as const,
	userData: (tmdbId: string) => ['movie', tmdbId, 'user-data'] as const,
	/** The request, the rule and the preference of the user: what their actions change */
	requests: (tmdbId: string) => ['movie', tmdbId, 'requests'] as const,
	/** The status of the request and the files of the movie: what the jobs of the server change */
	status: (tmdbId: string) => ['movie', tmdbId, 'status'] as const,
	/** The torrents of the movie as the engine has them */
	torrents: (tmdbId: string) => ['movie', tmdbId, 'torrents'] as const,
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
			queryFn: () => reiverrApi.userData.getMovieUserData(tmdbId).then((r) => r.data)
		}),
	/** The request of the user for the movie, with the rule and the preference it is fulfilled by */
	requests: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.requests(tmdbId),
			queryFn: () => reiverrApi.requests.getMovieRequests(tmdbId).then((r) => r.data)
		}),
	/** How the library fulfils the request of the user, and the files of the movie */
	status: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.status(tmdbId),
			queryFn: () => reiverrApi.library.getMovieStatus(tmdbId).then((r) => r.data)
		}),
	/** The torrents of the movie, live: polled while one runs, told by the server otherwise */
	torrents: (tmdbId: string) =>
		queryOptions({
			queryKey: movieKeys.torrents(tmdbId),
			queryFn: () => reiverrApi.downloads.getMovieTorrents(tmdbId).then((r) => r.data),
			select: toTitleTorrents,
			refetchInterval: liveRefetchInterval
		}),
	/** The files of the movie on disk, with their subtitles, for the player */
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
	await reiverrApi.userData.updateMoviePlayState(tmdbId, playState);
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all, storageKeys.all);
}

export async function setMovieWatched(tmdbId: string, watched: boolean) {
	await reiverrApi.userData.updateMoviePlayState(tmdbId, { watched });
	// The rule of the movie follows the watched state, so its request and the status change with
	// it, and the usage when the rule deletes the watched request
	await invalidate(
		movieKeys.userData(tmdbId),
		movieKeys.requests(tmdbId),
		movieKeys.status(tmdbId),
		catalogKeys.all,
		storageKeys.all
	);
}

export async function setMovieInMyList(tmdbId: string, inMyList: boolean) {
	await (inMyList
		? reiverrApi.userData.addMovieToMyList(tmdbId)
		: reiverrApi.userData.removeMovieFromMyList(tmdbId));
	await invalidate(movieKeys.userData(tmdbId), catalogKeys.all);
}

/** The request of the user and its status follow a change of it; the lists show whether the user requested the title */
const movieRequestsChanged = (tmdbId: string) =>
	invalidate(
		movieKeys.requests(tmdbId),
		movieKeys.status(tmdbId),
		storageKeys.all,
		catalogKeys.all
	);

export async function setMovieRequested(tmdbId: string, requested: boolean) {
	await (requested
		? reiverrApi.requests.createMovieRequest(tmdbId)
		: reiverrApi.requests.deleteMovieRequest(tmdbId));
	await movieRequestsChanged(tmdbId);
}

/** The rule may delete the watched request; the usage lists the rule of the title */
export async function updateMovieRequestRule(tmdbId: string, rule: MovieRequestRuleDto) {
	await reiverrApi.requests.updateMovieRequestRule(tmdbId, rule);
	await movieRequestsChanged(tmdbId);
}

/** Selects a release or a file for the movie */
export async function setMoviePreference(tmdbId: string, preference: SetPreferenceDto) {
	await reiverrApi.requests.setMoviePreference(tmdbId, preference);
	// What the request has and downloads, and so what it takes, follows the source
	await movieRequestsChanged(tmdbId);
}

export async function clearMoviePreference(tmdbId: string) {
	await reiverrApi.requests.clearMoviePreference(tmdbId);
	await movieRequestsChanged(tmdbId);
}

/** The three documents of a movie the request views read, each as far as it has loaded */
export type MovieData = {
	requests?: MovieRequestsDto;
	status?: MovieStatusDto;
	torrents?: TitleTorrents;
};

export type MovieRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one */
	infoHash?: string;
	/** The name of that torrent, or of the file selected for the movie */
	sourceName?: string;
	label?: string;
	isError: boolean;
};

export function getMovieRequestStatus({
	requests,
	status,
	torrents
}: MovieData): MovieRequestStatus {
	const selected = requests?.preference;
	const fulfilment = status?.fulfilment;
	const files = status?.files ?? [];
	// A request that has its file keeps its torrent when another one is selected
	const infoHash = heldFileOf(fulfilment, files)?.infoHash ?? selected?.release?.infoHash;
	const torrent = infoHash ? torrents?.get(infoHash) : undefined;
	const release = selected?.release?.infoHash === infoHash ? selected?.release : undefined;
	const file = selected?.mediaFileId
		? files.find((file) => file.id === selected.mediaFileId)
		: undefined;
	const mediaStatus = {
		request: requests?.request,
		preference: selected,
		fulfilment,
		files,
		torrent,
		torrentItem: torrentItemOf(torrent, 0, 0)
	};

	return {
		requested: !!requests?.request,
		onDisk: files.length > 0,
		infoHash,
		sourceName: torrent?.title ?? release?.title ?? file?.fileName,
		label: getStatusLabel(mediaStatus),
		isError: isErrorStatus(mediaStatus)
	};
}
