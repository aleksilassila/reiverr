import { createModal } from '$lib/components/Modal/modal.store';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { streamTmdbItem } from '$lib/components/VideoPlayer/VideoPlayer';
import StreamSelectorModal from '$lib/pages/TitlePages/StreamSelectorModal.svelte';
import { derived, get, writable, type Readable } from 'svelte/store';
import type {
	MediaSource,
	MovieUserDataDto,
	SeriesUserDataDto,
	StreamCandidateDto
} from '../apis/reiverr/reiverr.openapi';
import type { MediaType } from '../types';
import {
	episodeUserDataStore,
	libraryItemsDataStore,
	movieUserDataStore,
	seriesUserDataStore,
	tmdbSeriesDataStore
} from './data.store';
import { reiverrApiNew, sources, user } from './user.store';

export type EpisodeData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

async function getAllStreams(
	tmdbId: string,
	season?: number,
	episode?: number
): Promise<{ source: MediaSource; streams: StreamCandidateDto[] }[]> {
	return Promise.all(
		get(sources).map(async (source) => {
			return {
				source: source.source,
				streams: await getStreams(source.source, tmdbId, season, episode)
			};
		})
	);
}

async function getStreams(
	source: MediaSource,
	tmdbId: string,
	season?: number,
	episode?: number
): Promise<StreamCandidateDto[]> {
	return season !== undefined && episode !== undefined
		? reiverrApiNew.sources
				.getEpisodeStreams(source.id, tmdbId, season, episode)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => [])
		: reiverrApiNew.sources
				.getMovieStreams(source.id, tmdbId)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => []);
}

async function handleAutoplay(options: {
	tmdbId: string;
	season?: number;
	episode?: number;
	progress?: number;
}) {
	const { tmdbId, season, episode, progress } = options;

	const awaitedStreams = await getAllStreams(tmdbId, season, episode);

	const firstSource = awaitedStreams.find((p) => p.streams.length > 0);
	const source = firstSource?.source;
	const key = firstSource?.streams[0]?.key;

	if (!source) {
		createErrorNotification('No source found');
		return;
	}
	if (!key) {
		createErrorNotification('No key found');
		return;
	}

	streamTmdbItem({
		tmdbId,
		season,
		episode,
		progress,
		source,
		key
	});
}

function useUserLibrary(
	mediaType: MediaType,
	tmdbId: string,
	userDataP: Readable<MovieUserDataDto | SeriesUserDataDto | undefined>
) {
	const inLibrary = writable<boolean>(undefined);

	userDataP.subscribe((d) => {
		inLibrary.set(d?.inLibrary ?? false);
	});

	async function handleAddToLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApiNew.users
			.addLibraryItem(userId, tmdbId, { mediaType })
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(true);
			libraryItemsDataStore.refreshIn(1500);
		}
	}

	async function handleRemoveFromLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Remove from library: No user ID');
			return;
		}

		const success = await reiverrApiNew.users
			.removeLibraryItem(userId, tmdbId)
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(false);
			libraryItemsDataStore.refreshIn(1500);
		}
	}

	return {
		inLibrary,
		handleAddToLibrary,
		handleRemoveFromLibrary
	};
}

function useIsWatched(
	userData: Readable<MovieUserDataDto | undefined>,
	toggleFn: (userId: string, watched: boolean) => Promise<any>
) {
	const isWatched = writable<boolean>(undefined);

	userData.subscribe((d) => {
		isWatched.set(d?.playState?.watched ?? false);
	});

	async function toggleIsWatched() {
		const watched = get(isWatched);
		const userId = get(user)?.id;

		if (!userId) {
			return;
		}

		return toggleFn(userId, !watched).finally(() => {
			isWatched.set(!watched);
			libraryItemsDataStore.refreshIn(1500);
		});
	}

	return {
		isWatched,
		toggleIsWatched
	};
}

function useCanStream() {
	const canStream = writable(true);

	return {
		canStream
	};
}

export function useSeriesUserData(tmdbId: string) {
	const userDataRequest = seriesUserDataStore.subscribe(tmdbId);
	const tmdbSeriesRequest = tmdbSeriesDataStore.subscribe(Number(tmdbId));
	const libraryStore = useUserLibrary('Series', tmdbId, userDataRequest);
	const canStreamStore = useCanStream();
	const episodesUserData = writable<EpisodeData[]>([]);
	const nextEpisode = writable<EpisodeData>({
		season: 1,
		episode: 1,
		progress: 0,
		watched: false,
		upcoming: false
	});
	const isWatched = derived(episodesUserData, (episodes) =>
		episodes.every((e) => e.watched || e.upcoming)
	);

	derived([userDataRequest, tmdbSeriesRequest], (_) => _).subscribe(([userData, tmdbSeries]) => {
		if (!tmdbSeries) return;

		const episodesData: EpisodeData[] = [];
		let foundNext = false;
		for (let season = 1; season <= (tmdbSeries.number_of_seasons ?? 0); season++) {
			const s = tmdbSeries.seasons?.find((s) => s.season_number === season);
			for (let episode = 1; episode <= (s?.episode_count ?? 0); episode++) {
				const ep = userData?.playStates?.find((p) => p.season === season && p.episode === episode);
				const upcoming = !s?.air_date || new Date(s.air_date) > new Date();
				if (!foundNext && !ep?.watched) {
					nextEpisode.set({
						season,
						episode,
						progress: ep?.progress ?? 0,
						watched: ep?.watched ?? false,
						upcoming
					});
					foundNext = true;
				}
				episodesData.push({
					season,
					episode,
					watched: ep?.watched ?? false,
					progress: ep?.progress ?? 0,
					upcoming
				});
			}
		}
		episodesUserData.set(episodesData);
	});

	async function toggleIsWatched() {
		const watched = get(isWatched);
		const userId = get(user)?.id;

		if (!userId) {
			return;
		}

		return reiverrApiNew.users
			.updateSeriesPlayStatesByTmdbId(userId, tmdbId, {
				playStates: get(episodesUserData)
					.filter((e) => !e.upcoming)
					.map((e) => ({
						season: e.season,
						episode: e.episode,
						watched: !watched
					}))
			})
			.then(async (states) => {
				await seriesUserDataStore.refresh(tmdbId);
				return states;
			})
			.finally(() => {
				libraryItemsDataStore.refreshIn(1500);
			});
	}

	return {
		tmdbSeries: tmdbSeriesRequest.promise,
		...libraryStore,
		...canStreamStore,
		nextEpisode,
		episodesUserData,
		isWatched,
		toggleIsWatched,
		handleAutoplay: async () => {
			const { season, episode, progress } = get(nextEpisode) ?? {};

			if (season === undefined || episode === undefined) {
				createErrorNotification('Could not find next episode');
				return;
			}

			return handleAutoplay({ tmdbId, season, episode, progress });
		},
		handleOpenStreamSelector: async () => {
			const { season, episode } = get(nextEpisode) ?? {};

			if (season === undefined || episode === undefined) {
				createErrorNotification('Could not find next episode');
				return;
			}

			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId, season, episode),
				selectStream: (source, stream) => {
					return streamTmdbItem({
						tmdbId,
						season,
						episode,
						progress: get(nextEpisode)?.progress,
						key: stream.key,
						source
					});
				}
			});

			// return handleOpenStreamSelector({ tmdbId, season, episode, progress });
		},
		unsubscribe: () => {
			userDataRequest.unsubscribe();
			tmdbSeriesRequest.unsubscribe();
		}
	};
}

export function useMovieUserData(tmdbId: string) {
	const userData = movieUserDataStore.subscribe(tmdbId);
	const libraryStore = useUserLibrary('Movie', tmdbId, userData);
	const canStreamStore = useCanStream();
	const isWatchedStore = useIsWatched(userData, (userId, watched) =>
		reiverrApiNew.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
			watched
		})
	);
	const progress = derived(userData, ($userData) => $userData?.playState?.progress ?? 0);

	return {
		...libraryStore,
		...canStreamStore,
		...isWatchedStore,
		progress,
		handleAutoplay: async () => handleAutoplay({ tmdbId, progress: get(progress) }),
		handleOpenStreamSelector: async () => {
			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId),
				selectStream: (source, stream) =>
					streamTmdbItem({
						tmdbId,
						progress: get(progress),
						key: stream.key,
						source
					})
			});
		},
		unsubscribe: () => userData.unsubscribe()
	};
}

export function useEpisodeUserData(tmdbId: string, season: number, episode: number) {
	const userData = episodeUserDataStore.subscribe(tmdbId, season, episode);
	const canStreamStore = useCanStream();
	const isWatchedStore = useIsWatched(userData, (userId, watched) =>
		reiverrApiNew.users
			.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
				watched
			})
			.finally(() => seriesUserDataStore.refresh(tmdbId))
	);
	const progress = derived(userData, ($userData) => $userData?.playState?.progress ?? 0);

	return {
		...canStreamStore,
		...isWatchedStore,
		progress,
		handleAutoplay: async () =>
			handleAutoplay({ tmdbId, season, episode, progress: get(progress) }),
		handleOpenStreamSelector: async () => {
			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId, season, episode),
				selectStream: (source, stream) =>
					streamTmdbItem({
						tmdbId,
						season,
						episode,
						progress: get(progress),
						key: stream.key,
						source
					})
			});
		},
		unsubscribe: () => userData.unsubscribe()
	};
}
