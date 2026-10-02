import type {
	EpisodeDownloadDto,
	EpisodeRefDto,
	MediaRequestDto,
	SeriesUserDataDto,
	TmdbSeriesFull,
	TorrentSelectionDto,
	TorrentStateDto
} from '$lib/apis/reiverr/reiverr.openapi';
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
	/** Requests of the current user */
	requests: Map<string, MediaRequestDto>;
	selections: Map<string, TorrentSelectionDto>;
	downloads: Map<string, EpisodeDownloadDto>;
	/** Running torrents by selection id */
	torrents: Map<string, TorrentStateDto>;
	onDisk: Set<string>;
};

export type EpisodeRequestStatus = {
	requested: boolean;
	/** The torrent the episode is downloaded from: its own, or else the season pack */
	selection?: TorrentSelectionDto;
	label?: string;
	isError: boolean;
};

export function getEpisodeRequestStatus(
	data: SeriesRequests | undefined,
	season: number,
	episode: number
): EpisodeRequestStatus {
	const key = episodeKey(season, episode);
	const request = data?.requests.get(key);
	const selection = data?.selections.get(key) ?? data?.selections.get(episodeKey(season, 0));
	const download = data?.downloads.get(key);
	const torrent = download && data?.torrents.get(download.selectionId);
	const onDisk = !!data?.onDisk.has(key);

	let label: string | undefined;
	if (onDisk) label = 'On disk';
	else if (download?.error) label = download.error;
	else if (torrent?.status === 'starting') label = 'Starting';
	else if (download) label = `Downloading ${Math.floor(download.progress * 100)}%`;
	else if (request && !request.approved) label = 'Waiting for approval';
	else if (request && !selection) label = 'No torrent selected';
	else if (request) label = 'Requested';

	return { requested: !!request, selection, label, isError: !onDisk && !!download?.error };
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

	const requestsData = useData(async (): Promise<SeriesRequests> => {
		const [requests, downloads] = await Promise.all([
			reiverrApi.mediaRequests
				.getSeriesRequests(get(user)?.id as string, tmdbId)
				.then((r) => r.data),
			reiverrApi.downloads.getSeriesDownloads(tmdbId).then((r) => r.data)
		]);

		return {
			requests: new Map(requests.map((r) => [episodeKey(r.season, r.episode), r])),
			selections: new Map(downloads.selections.map((s) => [episodeKey(s.season, s.episode), s])),
			downloads: new Map(downloads.episodes.map((e) => [episodeKey(e.season, e.episode), e])),
			torrents: new Map(downloads.torrents.map((t) => [t.selectionId, t])),
			onDisk: new Set(downloads.onDisk.map((e) => episodeKey(e.season, e.episode)))
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
		await reiverrApi.mediaRequests.updateSeriesRequests(get(user)?.id as string, tmdbId, {
			episodes,
			requested
		});

		return requestsData.update();
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
		setWatched,
		episodesData,
		setStale,
		unsubscribe: () => {
			unsubscribe();
		}
	};
}
