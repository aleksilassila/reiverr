import type {
	EpisodeRefDto,
	EpisodeStatusDto,
	SeriesUserDataDto,
	TmdbSeriesFull,
	TorrentDto,
	TorrentSelectionDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { continueWatchingSeriesContext } from './continue-watching-data.store';
import { useData, useStaleable } from './data.store';
import { libraryContext } from './library-data.store';
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
	selections: Map<string, TorrentSelectionDto>;
	/** Info hashes of the torrents the server has for the series */
	onServer: Set<string>;
};

export type EpisodeRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one: the episode's own, or the season pack */
	torrent?: TorrentDto;
	/** The torrent is the season pack, which was not selected for this episode */
	isSeasonPack: boolean;
	label?: string;
	isError: boolean;
};

function formatTimeUntil(date: string): string {
	const hours = Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 3_600_000));
	const days = Math.round(hours / 24);

	if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
	return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}

function getStatusLabel(status?: EpisodeStatusDto): string | undefined {
	switch (status?.status) {
		case 'downloading':
			return `Downloading ${Math.floor((status.progress ?? 0) * 100)}%`;
		case 'resolving':
			return 'Starting';
		case 'failed':
		case 'no-file-in-torrent':
			return status.error;
	}

	// The rule of the series keeps the request from downloading and from keeping its file
	const inactive =
		status?.status === 'inactive-ahead'
			? 'Not needed yet'
			: status?.status === 'inactive-watched'
				? 'Watched, not kept'
				: undefined;

	// No request of anyone keeps a file of the episode from the next cleanup
	if (status?.onDisk && status.cleanupAt) {
		return `On disk · Deleted ${formatTimeUntil(status.cleanupAt)}`;
	}
	// A file of another torrent, or one that was found on disk, plays as well
	if (status?.onDisk) return inactive ? `On disk · ${inactive}` : 'On disk';
	if (status?.status === 'waiting-for-approval') return 'Waiting for approval';
	if (status?.status === 'no-selection') return 'No torrent selected';

	return inactive;
}

export function getEpisodeRequestStatus(
	data: SeriesRequests | undefined,
	season: number,
	episode: number
): EpisodeRequestStatus {
	const key = episodeKey(season, episode);
	const status = data?.episodes.get(key);
	const own = data?.selections.get(key);
	const seasonPack = data?.selections.get(episodeKey(season, 0));
	// A request that has its file keeps its torrent when another one is selected
	const torrent = status?.torrent ?? (own ?? seasonPack)?.torrent;

	return {
		requested: !!status?.requested,
		onDisk: !!status?.onDisk,
		torrent,
		isSeasonPack: !own && !!torrent && torrent.id === seasonPack?.torrent.id,
		label: getStatusLabel(status),
		isError: status?.status === 'failed' || status?.status === 'no-file-in-torrent'
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

		inLibrary.set(data.inLibrary);
		isWatched.set(data.playStates.every((ps) => ps.watched));

		return data;
	});

	// The page refreshes the requests periodically, so a failure is reported once
	let requestsFailed = false;
	const requestsData = useData(async (): Promise<SeriesRequests> => {
		const downloads = await reiverrApi.downloads
			.getSeriesDownloads(tmdbId)
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
			selections: new Map(downloads.selections.map((s) => [episodeKey(s.season, s.episode), s])),
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

		const success = await reiverrApi.users.updateSeriesPlayStatesByTmdbId(userId, tmdbId, {
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
		await reiverrApi.requests.updateSeriesRequests(get(user)?.id as string, tmdbId, {
			episodes,
			requested
		});

		return requestsData.update();
	}

	async function setEpisodeWatched(season: number, episode: number, watched: boolean) {
		const userId = get(user)?.id;
		if (!userId) return;

		await reiverrApi.users.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
			watched
		});

		return invalidateData();
	}

	async function setInLibrary(state: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApi.library
			.updateLibraryItem(userId, tmdbId, { mediaType: 'series', inLibrary: state })
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
		setWatched,
		episodesData,
		setStale,
		unsubscribe: () => {
			unsubscribe();
		}
	};
}
