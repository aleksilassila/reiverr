import type {
	EpisodePreferenceDto,
	EpisodeRefDto,
	EpisodeStatusDto,
	PreferredFileDto,
	RequestRuleDto,
	SeriesStatusDto,
	SeriesUserDataDto,
	SetPreferenceDto,
	TmdbSeriesFull,
	TorrentDto,
	UpdatePlayStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { getStatusLabel, isErrorStatus } from './request-status';
import { getUserId, reiverrApi } from '$lib/stores/user.store';
import { queryOptions, skipToken } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { invalidate } from './query-client';
import { storageKeys } from './storage.queries';

const HOUR = 3_600_000;

export const seriesKeys = {
	/** Every series: what a change on the server's files invalidates */
	all: ['series'] as const,
	/** Everything of the series: what a change of its play states or requests invalidates */
	title: (tmdbId: string) => ['series', tmdbId] as const,
	metadata: (tmdbId: string) => ['series', tmdbId, 'metadata'] as const,
	userData: (tmdbId: string) => ['series', tmdbId, 'user-data'] as const,
	status: (tmdbId: string) => ['series', tmdbId, 'status'] as const,
	rule: (tmdbId: string) => ['series', tmdbId, 'rule'] as const,
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
			queryFn: () => reiverrApi.users.getSeriesUserData(getUserId(), tmdbId).then((r) => r.data)
		}),
	/** Where the requests of the user stand, by episode */
	status: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.status(tmdbId),
			queryFn: () => reiverrApi.library.getSeriesStatus(tmdbId).then((r) => r.data),
			select: toSeriesRequests
		}),
	/** The limits of the requests of the user for the series */
	rule: (tmdbId: string) =>
		queryOptions({
			queryKey: seriesKeys.rule(tmdbId),
			queryFn: () =>
				reiverrApi.requests.getSeriesRequestRule(getUserId(), tmdbId).then((r) => r.data)
		}),
	/** The files of the episode in the library, external or imported; nothing without an episode */
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

/** The progress of playback: the user data of the series and the lists follow */
export async function saveEpisodePlayState(
	tmdbId: string,
	season: number,
	episode: number,
	playState: UpdatePlayStateDto
) {
	await reiverrApi.users.updateEpisodePlayState(getUserId(), tmdbId, season, episode, playState);
	await invalidate(seriesKeys.userData(tmdbId), catalogKeys.all);
}

/** The rule of the series follows the watched state, so its status changes with it */
const seriesWatchedChanged = (tmdbId: string) =>
	invalidate(seriesKeys.userData(tmdbId), seriesKeys.status(tmdbId), catalogKeys.all);

export async function setEpisodeWatched(
	tmdbId: string,
	season: number,
	episode: number,
	watched: boolean
) {
	await reiverrApi.users.updateEpisodePlayState(getUserId(), tmdbId, season, episode, { watched });
	await seriesWatchedChanged(tmdbId);
}

export async function setEpisodesWatched(
	tmdbId: string,
	playStates: { season: number; episode: number; watched: boolean }[]
) {
	await reiverrApi.users.updateSeriesPlayStates(getUserId(), tmdbId, { playStates });
	await seriesWatchedChanged(tmdbId);
}

export async function setSeriesInMyList(tmdbId: string, inMyList: boolean) {
	await reiverrApi.myList.setMyListItem(getUserId(), tmdbId, { mediaType: 'series', inMyList });
	await invalidate(seriesKeys.userData(tmdbId), catalogKeys.all);
}

export async function setSeriesRequests(
	tmdbId: string,
	episodes: EpisodeRefDto[],
	requested: boolean
) {
	await reiverrApi.requests.setSeriesRequests(getUserId(), tmdbId, { episodes, requested });
	// The lists show whether the user requested the title
	await invalidate(seriesKeys.status(tmdbId), storageKeys.all, catalogKeys.all);
}

export async function updateSeriesRequestRule(tmdbId: string, rule: RequestRuleDto) {
	await reiverrApi.requests.updateSeriesRequestRule(getUserId(), tmdbId, rule);
	await invalidate(seriesKeys.rule(tmdbId), seriesKeys.status(tmdbId));
}

/** Selects a release or a file for the episode, or a season pack without an episode */
export async function setPreference(
	tmdbId: string,
	season: number,
	episode: number | undefined,
	preference: SetPreferenceDto
) {
	await (episode === undefined
		? reiverrApi.requests.setSeasonPreference(getUserId(), tmdbId, season, preference)
		: reiverrApi.requests.setEpisodePreference(getUserId(), tmdbId, season, episode, preference));
	await invalidate(seriesKeys.status(tmdbId));
}

export async function clearPreference(tmdbId: string, season: number, episode: number | undefined) {
	await (episode === undefined
		? reiverrApi.requests.clearSeasonPreference(getUserId(), tmdbId, season)
		: reiverrApi.requests.clearEpisodePreference(getUserId(), tmdbId, season, episode));
	await invalidate(seriesKeys.status(tmdbId));
}

export const episodeKey = (season: number, episode: number) => `${season}-${episode}`;

/** Everything is keyed by {@link episodeKey}; a season pack selection has episode 0 */
export type SeriesRequests = {
	/** The episodes the current user requested or that are on disk */
	episodes: Map<string, EpisodeStatusDto>;
	/** The torrents the current user selected */
	preferences: Map<string, EpisodePreferenceDto>;
	/** Info hashes of the torrents the server has for the series */
	onServer: Set<string>;
};

function toSeriesRequests(status: SeriesStatusDto): SeriesRequests {
	return {
		episodes: new Map(status.episodes.map((e) => [episodeKey(e.season, e.episode), e])),
		preferences: new Map(status.preferences.map((s) => [episodeKey(s.season, s.episode), s])),
		onServer: new Set(status.onServer)
	};
}

export type EpisodeRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one: the episode's own, or the season pack */
	torrent?: TorrentDto;
	/** The file in the library selected for the episode */
	file?: PreferredFileDto;
	/** The torrent is the season pack, which was not selected for this episode */
	isSeasonPack: boolean;
	label?: string;
	isError: boolean;
};

export function getEpisodeRequestStatus(
	data: SeriesRequests | undefined,
	season: number,
	episode: number
): EpisodeRequestStatus {
	const key = episodeKey(season, episode);
	const status = data?.episodes.get(key);
	const own = data?.preferences.get(key);
	const seasonPack = data?.preferences.get(episodeKey(season, 0));
	// A request that has its file keeps its torrent when another one is selected
	const torrent = status?.torrent ?? (own ?? seasonPack)?.torrent;

	return {
		requested: !!status?.requested,
		onDisk: !!status?.onDisk,
		torrent,
		file: own?.file,
		isSeasonPack: !own && !!torrent && torrent.infoHash === seasonPack?.torrent?.infoHash,
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
