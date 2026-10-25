import type {
	EpisodePreferenceDto,
	EpisodeRefDto,
	EpisodeStatusDto,
	PreferredFileDto,
	SeriesUserDataDto,
	TmdbSeriesFull,
	TorrentDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { continueWatchingSeriesContext } from './continue-watching-data.store';
import { useData, useStaleable } from './data.store';
import { libraryContext } from './library-data.store';
import { getStatusLabel, isErrorStatus } from './request-status';
import { reiverrApi, user } from '../user.store';

export type EpisodeUserData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

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

function getEpisodeData(tmdbSeries?: TmdbSeriesFull, userData?: SeriesUserDataDto) {
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

function useEpisodeData(tmdbId: string, season: number, episode: number) {}

// function useEpisodesData() {
// 	let stores = new Map<string, ReturnType<typeof useEpisodeData>>();

// 	const episodesData = derived([seriesData.data, userData.data], ([$seriesData, $userData]) =>
// 		getEpisodeData($seriesData, $userData)
// 	);

// 	function getEpisode(tmdbId: string, season: number, episode: number) {
// 		const key = `${tmdbId}-${season}-${episode}`;
// 		if (!stores.has(key)) {
// 			stores.set(key, useEpisodeData(tmdbId, season, episode));
// 		}
// 		return stores.get(key) as ReturnType<typeof useEpisodeData>;
// 	}

// 	return {
// 		getEpisode,
// 	}
// }

export const useSeriesContext = (tmdbId: string) =>
	createStoreContext(`series-${tmdbId}`, () => useSeriesData(tmdbId));

function useSeriesData(tmdbId: string) {
	const previous = useSeriesContext(tmdbId).getContext();
	const previousContinueWatching = continueWatchingSeriesContext.getContext();
	const previousLibrary = libraryContext.getContext();

	const componentStack = useComponentStack();
	// const backgroundStack = backgroundContext.createContext({
	// 	backgroundMediaId: tmdbId,
	// 	videoMediaId: tmdbId
	// });

	const inLibrary = writable(false);
	const isWatched = writable(false);

	const seriesData = useData(() =>
		reiverrApi.metadata.getSeries(tmdbId).then((r) => r.data.tmdbSeries)
	);
	const userData = useData(async () => {
		const data = await reiverrApi.users
			.getSeriesUserData(get(user)?.id as string, tmdbId)
			.then((r) => r.data);

		inLibrary.set(data.inMyList);
		isWatched.set(data.playStates.every((ps) => ps.watched));

		return data;
	});

	// The page refreshes the requests periodically, so a failure is reported once
	let requestsFailed = false;
	const requestsData = useData(async (): Promise<SeriesRequests> => {
		const downloads = await reiverrApi.library
			.getSeriesStatus(tmdbId)
			.then((r) => r.data)
			.catch((e) => {
				if (!requestsFailed) {
					createErrorNotification(
						'Could not load requests',
						e?.response?.data?.message ?? e?.message ?? String(e)
					);
				}
				requestsFailed = true;
				throw e;
			});
		requestsFailed = false;

		return {
			episodes: new Map(downloads.episodes.map((e) => [episodeKey(e.season, e.episode), e])),
			preferences: new Map(downloads.preferences.map((s) => [episodeKey(s.season, s.episode), s])),
			onServer: new Set(downloads.onServer)
		};
	});
	const episodesData = derived([seriesData.data, userData.data], ([$seriesData, $userData]) =>
		getEpisodeData($seriesData, $userData)
	);

	async function setWatched(watched: boolean) {
		// Potentially update up next
		// previous?.setStale();
		// library.setStale();

		const userId = get(user)?.id;

		if (!userId) {
			console.error('Set watched: No user ID');
			return;
		}

		const success = await reiverrApi.users.updateSeriesPlayStates(userId, tmdbId, {
			playStates: get(episodesData)
				?.episodes.filter((e) => !e.upcoming)
				.map((e) => ({
					season: e.season,
					episode: e.episode,
					watched: !watched
				}))
		});

		return invalidateData();
	}

	async function setRequested(episodes: EpisodeRefDto[], requested: boolean) {
		await reiverrApi.requests.setSeriesRequests(get(user)?.id as string, tmdbId, {
			episodes,
			requested
		});

		return requestsData.update();
	}

	async function setEpisodeWatched(season: number, episode: number, watched: boolean) {
		const userId = get(user)?.id;
		if (!userId) return;

		await reiverrApi.users.updateEpisodePlayState(userId, tmdbId, season, episode, {
			watched
		});

		return invalidateData();
	}

	async function setSeasonWatched(season: number, watched: boolean) {
		const userId = get(user)?.id;
		if (!userId) return;

		await reiverrApi.users.updateSeriesPlayStates(userId, tmdbId, {
			playStates: get(episodesData)
				.episodes.filter((e) => e.season === season && !e.upcoming)
				.map((e) => ({ season: e.season, episode: e.episode, watched }))
		});

		return invalidateData();
	}

	async function setInLibrary(state: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApi.myList
			.setMyListItem(userId, tmdbId, { mediaType: 'series', inMyList: state })
			.then((r) => r.data.success);

		if (success) {
			inLibrary.set(state);
			previous.inLibrary?.set(state);
			// previous.setStale?.();
			previousContinueWatching.setStale?.();
			previousLibrary.setStale?.();

			// previousLibrary.setStale?.();
			// previousNextUp.setStale?.();
		}
	}

	function invalidateData() {
		previous.setStale?.();
		previousContinueWatching.setStale?.();
		previousLibrary.setStale?.();
		return userData.update();
	}

	const { setStale, unsubscribe } = useStaleable(() => invalidateData());

	return {
		componentStack,
		// backgroundStack,
		seriesData,
		userData,
		requestsData,
		inLibrary,
		isWatched,
		setInLibrary,
		setRequested,
		setEpisodeWatched,
		setSeasonWatched,
		setWatched,
		episodesData,
		setStale,
		unsubscribe: () => {
			unsubscribe();
		}
	};
}
