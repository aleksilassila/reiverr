import type {
	EpisodeRefDto,
	FulfilmentStatusDto,
	MediaFileDto,
	MediaRequestDto,
	PreferenceDto,
	RequestRuleDto,
	SeriesRequestsDto,
	SeriesStatusDto,
	SeriesUserDataDto,
	SetPreferenceDto,
	TmdbSeriesFull,
	UpdatePlayStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions, skipToken } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { invalidate } from './query-client';
import {
	getStatusLabel,
	heldFileOf,
	isErrorStatus,
	itemOf,
	liveRefetchInterval,
	type TitleTorrents,
	toTitleTorrents
} from './request-status';
import { storageKeys } from './storage.queries';

const HOUR = 3_600_000;

export const seriesKeys = {
	/** Every series: what a change on the server's files invalidates */
	all: ['series'] as const,
	/** Everything of the series: what a change of its play states or requests invalidates */
	title: (tmdbId: string) => ['series', tmdbId] as const,
	metadata: (tmdbId: string) => ['series', tmdbId, 'metadata'] as const,
	userData: (tmdbId: string) => ['series', tmdbId, 'user-data'] as const,
	/** The requests, the rule and the preferences of the user: what their actions change */
	requests: (tmdbId: string) => ['series', tmdbId, 'requests'] as const,
	/** The status of the requests and the files of the series: what the jobs of the server change */
	status: (tmdbId: string) => ['series', tmdbId, 'status'] as const,
	/** The torrents of the series as the engine has them */
	torrents: (tmdbId: string) => ['series', tmdbId, 'torrents'] as const,
	/** Every file list of the series: what a change of its files invalidates */
	files: (tmdbId: string) => ['series', tmdbId, 'files'] as const,
	episodeFiles: (tmdbId: string, season: number, episode: number | undefined) =>
		['series', tmdbId, 'files', season, episode ?? null] as const,
	releases: (tmdbId: string, season: number, episode: number | undefined) =>
		['series', tmdbId, 'releases', season, episode ?? null] as const
};

export const seriesQueries = {
	/** The TMDB document of the series, with every season */
	metadata: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.metadata(tmdbId),
			queryFn: () => reiverrApi.metadata.getSeries(tmdbId).then((r) => r.data.tmdbSeries),
			staleTime: HOUR
		}),
	/** Whether the series is in my list, and the play states of the user */
	userData: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.userData(tmdbId),
			queryFn: () => reiverrApi.userData.getSeriesUserData(tmdbId).then((r) => r.data)
		}),
	/** The requests of the user for the series, with the rule and the preferences they are fulfilled by */
	requests: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.requests(tmdbId),
			queryFn: () => reiverrApi.requests.getSeriesRequests(tmdbId).then((r) => r.data),
			select: toSeriesRequests
		}),
	/** How the library fulfils the requests of the user, and the files of the series */
	status: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.status(tmdbId),
			queryFn: () => reiverrApi.library.getSeriesStatus(tmdbId).then((r) => r.data),
			select: toSeriesStatus
		}),
	/** The torrents of the series, live: polled while one runs, told by the server otherwise */
	torrents: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.torrents(tmdbId),
			queryFn: () => reiverrApi.downloads.getSeriesTorrents(tmdbId).then((r) => r.data),
			select: toTitleTorrents,
			refetchInterval: liveRefetchInterval
		}),
	/** The files of the episode on disk, with their subtitles, for the player; nothing without an episode */
	episodeFiles: (tmdbId: string, season: number, episode: number | undefined) =>
		queryOptions({
			queryKey: seriesKeys.episodeFiles(tmdbId, season, episode),
			queryFn:
				episode === undefined
					? skipToken
					: () => reiverrApi.library.getEpisodeFiles(tmdbId, season, episode).then((r) => r.data)
		}),
	/** What the indexers have for the episode, or the season packs without one; searched again on every view */
	releases: (tmdbId: string, season: number, episode: number | undefined) =>
		queryOptions({
			queryKey: seriesKeys.releases(tmdbId, season, episode),
			queryFn: () =>
				reiverrApi.indexers.searchSeriesReleases(tmdbId, { season, episode }).then((r) => r.data),
			staleTime: 0
		})
};

/**
 * The progress of playback: the user data of the series and the lists follow, and the usage,
 * since a save past the end marks the episode watched
 */
export async function saveEpisodePlayState(
	tmdbId: string,
	season: number,
	episode: number,
	playState: UpdatePlayStateDto
) {
	await reiverrApi.userData.updateEpisodePlayState(tmdbId, season, episode, playState);
	await invalidate(seriesKeys.userData(tmdbId), catalogKeys.all, storageKeys.all);
}

/**
 * The rule of the series follows the watched state, so its requests and their status change with
 * it, and the usage when the rule deletes watched requests
 */
const seriesWatchedChanged = (tmdbId: string) =>
	invalidate(
		seriesKeys.userData(tmdbId),
		seriesKeys.requests(tmdbId),
		seriesKeys.status(tmdbId),
		catalogKeys.all,
		storageKeys.all
	);

export async function setEpisodeWatched(
	tmdbId: string,
	season: number,
	episode: number,
	watched: boolean
) {
	await reiverrApi.userData.updateEpisodePlayState(tmdbId, season, episode, { watched });
	await seriesWatchedChanged(tmdbId);
}

export async function setEpisodesWatched(
	tmdbId: string,
	playStates: { season: number; episode: number; watched: boolean }[]
) {
	await reiverrApi.userData.updateSeriesPlayStates(tmdbId, { playStates });
	await seriesWatchedChanged(tmdbId);
}

export async function setSeriesInMyList(tmdbId: string, inMyList: boolean) {
	await (inMyList
		? reiverrApi.userData.addSeriesToMyList(tmdbId)
		: reiverrApi.userData.removeSeriesFromMyList(tmdbId));
	await invalidate(seriesKeys.userData(tmdbId), catalogKeys.all);
}

/** The requests of the user and their status follow a change of them; the lists show whether the user requested the title */
const seriesRequestsChanged = (tmdbId: string) =>
	invalidate(
		seriesKeys.requests(tmdbId),
		seriesKeys.status(tmdbId),
		storageKeys.all,
		catalogKeys.all
	);

export async function setSeriesRequests(
	tmdbId: string,
	episodes: EpisodeRefDto[],
	requested: boolean
) {
	await reiverrApi.requests.setSeriesRequests(tmdbId, { episodes, requested });
	await seriesRequestsChanged(tmdbId);
}

/** The rule may let requests through or delete watched ones; the usage lists the rule of the title */
export async function updateSeriesRequestRule(tmdbId: string, rule: RequestRuleDto) {
	await reiverrApi.requests.updateSeriesRequestRule(tmdbId, rule);
	await seriesRequestsChanged(tmdbId);
}

/** Selects a release or a file for the episode, or a season pack without an episode */
export async function setPreference(
	tmdbId: string,
	season: number,
	episode: number | undefined,
	preference: SetPreferenceDto
) {
	await (episode === undefined
		? reiverrApi.requests.setSeasonPreference(tmdbId, season, preference)
		: reiverrApi.requests.setEpisodePreference(tmdbId, season, episode, preference));
	// What the requests have and download, and so what they take, follows the source
	await seriesRequestsChanged(tmdbId);
}

export async function clearPreference(tmdbId: string, season: number, episode: number | undefined) {
	await (episode === undefined
		? reiverrApi.requests.clearSeasonPreference(tmdbId, season)
		: reiverrApi.requests.clearEpisodePreference(tmdbId, season, episode));
	await seriesRequestsChanged(tmdbId);
}

export const episodeKey = (season: number, episode: number) => `${season}-${episode}`;

/** The requests document, keyed by {@link episodeKey}; a season pack selection has episode 0 */
export type SeriesRequests = {
	requests: Map<string, MediaRequestDto>;
	rule: RequestRuleDto;
	/** The releases and files the current user selected */
	preferences: Map<string, PreferenceDto>;
};

/** The status document */
export type SeriesStatus = {
	/** How the library fulfils the requests of the current user, by the id of the request */
	fulfilments: Map<string, FulfilmentStatusDto>;
	/** The files of the series in the index */
	files: MediaFileDto[];
};

/** The three documents of a series the request views read, each as far as it has loaded */
export type SeriesData = {
	requests?: SeriesRequests;
	status?: SeriesStatus;
	torrents?: TitleTorrents;
};

function toSeriesRequests(requests: SeriesRequestsDto): SeriesRequests {
	return {
		requests: new Map(requests.requests.map((r) => [episodeKey(r.season, r.episode), r])),
		rule: requests.rule,
		preferences: new Map(requests.preferences.map((p) => [episodeKey(p.season, p.episode), p]))
	};
}

function toSeriesStatus(status: SeriesStatusDto): SeriesStatus {
	return {
		fulfilments: new Map(status.fulfilments.map((f) => [f.requestId, f])),
		files: status.files
	};
}

export type EpisodeRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one: the episode's own, or the season pack */
	infoHash?: string;
	/** The name of that torrent, or of the file selected for the episode */
	sourceName?: string;
	/** The torrent is the season pack, which was not selected for this episode */
	isSeasonPack: boolean;
	label?: string;
	isError: boolean;
};

export function getEpisodeRequestStatus(
	data: SeriesData,
	season: number,
	episode: number
): EpisodeRequestStatus {
	const key = episodeKey(season, episode);
	const request = data.requests?.requests.get(key);
	const fulfilment = request && data.status?.fulfilments.get(request.id);
	const files = (data.status?.files ?? []).filter(
		(file) => file.season === season && file.episodes.includes(episode)
	);
	const own = data.requests?.preferences.get(key);
	const seasonPack = data.requests?.preferences.get(episodeKey(season, 0));
	const selected = own ?? seasonPack;
	// A request that has its file keeps its torrent when another one is selected
	const infoHash =
		fulfilment?.infoHash ??
		heldFileOf(fulfilment, data.status?.files)?.infoHash ??
		selected?.release?.infoHash;
	const torrent = infoHash ? data.torrents?.get(infoHash) : undefined;
	const release = selected?.release?.infoHash === infoHash ? selected?.release : undefined;
	const file = own?.mediaFileId
		? data.status?.files.find((file) => file.id === own.mediaFileId)
		: undefined;

	const status = {
		request,
		preference: selected,
		fulfilment,
		files,
		torrent,
		item: itemOf(torrent, season, episode)
	};

	return {
		requested: !!request,
		onDisk: files.length > 0,
		infoHash,
		sourceName: torrent?.title ?? release?.title ?? file?.fileName,
		isSeasonPack: !own && !!infoHash && infoHash === seasonPack?.release?.infoHash,
		label: getStatusLabel(status),
		isError: isErrorStatus(status)
	};
}

export type EpisodeUserData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

export type EpisodesData = {
	/** The episode after the last watched one */
	nextEpisode: EpisodeUserData | undefined;
	episodes: EpisodeUserData[];
};

/** The play state of every episode of the series, in season and episode order */
export function getEpisodeData(
	tmdbSeries?: TmdbSeriesFull,
	userData?: SeriesUserDataDto
): EpisodesData {
	let nextEpisodeData: EpisodeUserData | undefined = undefined;
	const episodesData: EpisodeUserData[] = [];
	let foundNext = false;
	const lastWatchedPlayState = userData?.playStates?.filter((p) => p.watched).pop();
	for (let season = 1; season <= (tmdbSeries?.number_of_seasons ?? 0); season++) {
		const s = tmdbSeries?.seasons?.find((s) => s.season_number === season);
		for (let episode = 1; episode <= (s?.episodes?.length ?? 0); episode++) {
			const ep = userData?.playStates?.find((p) => p.season === season && p.episode === episode);
			const upcoming = !s?.air_date || new Date(s.air_date) > new Date();

			const episodeData = {
				season,
				episode,
				watched: ep?.watched ?? false,
				progress: ep?.progress ?? 0,
				upcoming
			};

			if (
				!foundNext &&
				((lastWatchedPlayState?.season ?? Infinity) < season ||
					((lastWatchedPlayState?.season ?? Infinity) === season &&
						(lastWatchedPlayState?.episode ?? Infinity) < episode))
			) {
				nextEpisodeData = episodeData;
				foundNext = true;
			}
			episodesData.push(episodeData);
		}
	}

	return {
		nextEpisode: nextEpisodeData,
		episodes: episodesData
	};
}
