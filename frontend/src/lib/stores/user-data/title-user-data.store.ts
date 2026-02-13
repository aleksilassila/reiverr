import type { TmdbSeriesFull } from '$lib/apis/tmdb/tmdb-api';
import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import TmdbVideoPlayer from '$lib/components/VideoPlayer/MediaVideoPlayer.svelte';
import { createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import type {
	MediaSourceDto,
	SeriesUserDataDto,
	StreamBaseDto,
	StreamCandidateDto
} from '../../apis/reiverr/reiverr.openapi';
import {
	episodeUserDataRefresher,
	libraryRefresher,
	movieUserDataRefresher,
	seriesUserDataRefresher,
	useRequest
} from '../data.store';
import { reiverrApi, tmdbApi, user } from '../user.store';
import { useIsWatched } from './is-watched.store';
import { useUserLibrary } from './library.store';

export type EpisodeUserData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

/** @deprecated */
async function getAllStreams(
	tmdbId: string,
	season?: number,
	episode?: number
): Promise<{ source: MediaSourceDto; streams: StreamCandidateDto[] }[]> {
	return Promise.all(
		get(user)?.mediaSources.map(async (source) => {
			return {
				source: source,
				streams: await getStreams(source, tmdbId, season, episode)
			};
		}) ?? []
	);
}

/** @deprecated */
async function getStreams(
	source: MediaSourceDto,
	tmdbId: string,
	season?: number,
	episode?: number
): Promise<StreamCandidateDto[]> {
	return season !== undefined && episode !== undefined
		? reiverrApi.sources
				.getTmdbEpisodeCandidates(source.id, tmdbId, season, episode)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => [])
		: reiverrApi.sources
				.getTmdbMovieCandidates(source.id, tmdbId)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => []);
}

/** @deprecated */
async function getAutoplayStream(options: { tmdbId: string; season?: number; episode?: number }) {
	const { tmdbId, season, episode } = options;

	const awaitedStreams = await getAllStreams(tmdbId, season, episode);

	const firstSource = awaitedStreams.find((p) => p.streams.length > 0);
	const source = firstSource?.source;
	const streamId = firstSource?.streams[0]?.streamId;

	return {
		source,
		streamId
	};
}

function useAutoplay(options: {
	tmdbId: string;
	season?: number;
	episode?: number;
	playStream: (options: {
		source: MediaSourceDto;
		streamId: string;
		season?: number;
		episode?: number;
	}) => Promise<void>;
}) {
	const { tmdbId, season, episode, playStream } = options;

	const autoplayStore = writable<{
		isLoading: boolean;
		candidate?: {
			stream: StreamBaseDto;
			source: MediaSourceDto;
		};
	}>({
		isLoading: true
	});

	fetchAutoplayCandidate();

	async function fetchAutoplayCandidate() {
		for (const source of get(user)?.mediaSources ?? []) {
			const candidate = await reiverrApi.sources
				.getAutoplayStream(source.id, {
					tmdbId,
					season,
					episode
				})
				.then((r) => r.data.candidate);

			if (candidate) {
				autoplayStore.set({
					isLoading: false,
					candidate: {
						stream: candidate,
						source
					}
				});
				return candidate;
			}
		}

		autoplayStore.set({ isLoading: false });
	}

	async function autoplayStream() {
		const { stream, source } = get(autoplayStore)?.candidate ?? {};

		if (!stream || !source) {
			createErrorNotification('Autoplay failed', 'No stream found');
			return;
		}

		return playStream({
			source,
			streamId: stream.streamId,
			season,
			episode
		});
	}

	// async function playStream(source: MediaSourceDto, streamId: string) {
	// 	const props = await getVideoProps({ season, episode });

	// 	if (!props) {
	// 		createErrorNotification('Could not find video props');
	// 		return;
	// 	}

	// 	background?.setVideo({
	// 		id: Symbol(),
	// 		component: TmdbVideoPlayer,
	// 		props: {
	// 			...props,
	// 			streamId,
	// 			source
	// 		}
	// 	});

	// 	background?.focus();
	// }

	return {
		autoplayCandidate: { subscribe: autoplayStore.subscribe },
		autoplayStream
	};
}

function useCanStream() {
	const canStream = writable(true);

	return {
		canStream
	};
}

function createEpisodesUserData(opts: {
	seriesUserData?: SeriesUserDataDto;
	tmdbSeries: TmdbSeriesFull;
}) {
	const { seriesUserData, tmdbSeries } = opts;

	let nextEpisodeData: EpisodeUserData | undefined;
	const episodesData: EpisodeUserData[] = [];
	let foundNext = false;
	const lastWatchedPlayState = seriesUserData?.playStates?.filter((p) => p.watched).pop();
	for (let season = 1; season <= (tmdbSeries.number_of_seasons ?? 0); season++) {
		const s = tmdbSeries.seasons?.find((s) => s.season_number === season);
		for (let episode = 1; episode <= (s?.episode_count ?? 0); episode++) {
			const ep = seriesUserData?.playStates?.find(
				(p) => p.season === season && p.episode === episode
			);
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
				((lastWatchedPlayState?.season ?? 0) < season ||
					((lastWatchedPlayState?.season ?? 0) === season &&
						(lastWatchedPlayState?.episode ?? 0) < episode))
			) {
				nextEpisodeData = episodeData;
				foundNext = true;
			}
			episodesData.push(episodeData);
		}
	}

	return {
		nextEpisodeData,
		episodesData
	};
}

export type TitleUserData = ReturnType<typeof useMovieUserData> &
	ReturnType<typeof useSeriesUserData>;

export function useSeriesUserData(tmdbId: string) {
	const userDataRequest = useRequest(
		() => reiverrApi.users.getSeriesUserData(get(user)?.id as string, tmdbId).then((r) => r.data),
		{
			refresher: seriesUserDataRefresher,
			key: tmdbId
		}
	);
	const tmdbSeriesRequest = useRequest(() => tmdbApi.getSeriesFull(Number(tmdbId)));
	const libraryStore = useUserLibrary('series', tmdbId, userDataRequest);
	const episodesUserData = writable<EpisodeUserData[]>([]);
	const nextEpisode = writable<EpisodeUserData>({
		season: 1,
		episode: 1,
		progress: 0,
		watched: false,
		upcoming: false
	});
	const isWatched = derived(episodesUserData, (episodes) =>
		episodes.every((e) => e.watched || e.upcoming)
	);
	const background = getBackgroundPage();

	const unsub = derived([userDataRequest, tmdbSeriesRequest], (_) => _).subscribe(
		([userData, tmdbSeries]) => {
			if (!tmdbSeries) return;

			const { episodesData, nextEpisodeData } = createEpisodesUserData({
				seriesUserData: userData,
				tmdbSeries
			});

			if (nextEpisodeData) {
				nextEpisode.set(nextEpisodeData);
			}

			episodesUserData.set(episodesData);
		}
	);

	const autoplay = useAutoplay({
		tmdbId,
		season: get(nextEpisode)?.season,
		episode: get(nextEpisode)?.episode,
		playStream
	});

	async function toggleIsWatched() {
		const watched = get(isWatched);
		const userId = get(user)?.id;

		if (!userId) {
			return;
		}

		return reiverrApi.users
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
				await seriesUserDataRefresher.refresh(tmdbId);
				return states;
			})
			.finally(() => {
				libraryRefresher.refreshIn(500);
			});
	}

	// /** @deprecated */
	// async function getVideoProps(options?: { season?: number; episode?: number }) {
	// 	const tmdbSeriesData = get(tmdbSeriesRequest);

	// 	let episodeData: EpisodeData | undefined;
	// 	if (options?.season && options?.episode) {
	// 		episodeData = get(episodesUserData).find(
	// 			(e) => e.season === options.season && e.episode === options.episode
	// 		);
	// 	} else {
	// 		episodeData = get(nextEpisode);
	// 	}

	// 	const { season, episode, progress } = episodeData ?? {};

	// 	if (season === undefined || episode === undefined) {
	// 		createErrorNotification('Could not find next episode');
	// 		return;
	// 	}

	// 	const tmdbEpisode = await tmdbApi.v3
	// 		.tvEpisodeDetails(Number(tmdbId), season, episode)
	// 		.then((r) => r.data);

	// 	return {
	// 		tmdbId,
	// 		season,
	// 		episode,
	// 		progress: progress ?? 0,
	// 		title: tmdbEpisode?.name ?? 'Unknown',
	// 		subtitle: tmdbSeriesData?.name ?? 'Unknown'
	// 	};
	// }

	async function playStream(options: {
		source: MediaSourceDto;
		streamId: string;
		season?: number;
		episode?: number;
	}) {
		const { source, streamId } = options;

		const tmdbSeriesData = get(tmdbSeriesRequest);

		let episodeData: EpisodeUserData | undefined;
		if (options?.season && options?.episode) {
			episodeData = get(episodesUserData).find(
				(e) => e.season === options.season && e.episode === options.episode
			);
		} else {
			episodeData = get(nextEpisode);
		}

		const { season, episode, progress } = episodeData ?? {};

		if (season === undefined || episode === undefined) {
			createErrorNotification('Could not find next episode');
			return;
		}

		const tmdbEpisode = await tmdbApi.v3
			.tvEpisodeDetails(Number(tmdbId), season, episode)
			.then((r) => r.data);

		return background?.playMedia({
			source,
			streamId,
			tmdbId,
			season,
			episode,
			progress: progress ?? 0,
			title: tmdbEpisode?.name ?? 'Unknown',
			subtitle: tmdbSeriesData?.name ?? 'Unknown'
		});
	}

	return {
		tmdbId,
		tmdbSeries: tmdbSeriesRequest.promise,
		...libraryStore,
		...autoplay,
		playStream,
		nextEpisode,
		episodesUserData,
		isWatched,
		toggleIsWatched,
		// handleAutoplay: async () => {
		// 	const videoProps = await getVideoProps();

		// 	if (!videoProps) return;

		// 	const { season, episode } = videoProps;

		// 	const { streamId, source } = await getAutoplayStream({ tmdbId, season, episode });

		// 	if (!streamId || !source) {
		// 		createErrorNotification('Autoplay failed', 'No stream found');
		// 		return;
		// 	}

		// 	background?.setVideo({
		// 		id: Symbol(),
		// 		component: TmdbVideoPlayer,
		// 		props: {
		// 			...videoProps,
		// 			streamId,
		// 			source
		// 		},
		// 		mediaId: tmdbId
		// 	});

		// 	background?.focus();
		// },
		// handleOpenStreamSelector: async () => {
		// 	const videoProps = await getVideoProps();

		// 	if (!videoProps) return;

		// 	const { season, episode } = videoProps;

		// 	// createModal(StreamSelectorModal, {
		// 	// 	getStreams: (s) => getStreams(s, tmdbId, season, episode),
		// 	// 	selectStream: (source, stream) => {
		// 	// 		background?.setVideo({
		// 	// 			id: Symbol(),
		// 	// 			component: TmdbVideoPlayer,
		// 	// 			props: {
		// 	// 				...videoProps,
		// 	// 				streamId: stream.streamId,
		// 	// 				source
		// 	// 			},
		// 	// 			mediaId: tmdbId
		// 	// 		});

		// 	// 		background?.focus();
		// 	// 	}
		// 	// });

		// 	// createModal(MediaSourceMenuModal, {
		// 	// 	tmdbId,
		// 	// 	season,
		// 	// 	episode,
		// 	// 	playStream: (source, streamId) => {
		// 	// 		background?.setVideo({
		// 	// 			id: Symbol(),
		// 	// 			component: TmdbVideoPlayer,
		// 	// 			props: {
		// 	// 				...videoProps,
		// 	// 				streamId,
		// 	// 				source
		// 	// 			},
		// 	// 			mediaId: tmdbId
		// 	// 		});

		// 	// 		background?.focus();
		// 	// 	}
		// 	// });

		// 	// return handleOpenStreamSelector({ tmdbId, season, episode, progress });
		// },
		unsubscribe: () => {
			userDataRequest.unsubscribe();
			tmdbSeriesRequest.unsubscribe();
			unsub();
		}
	};
}

export function useMovieUserData(tmdbId: string) {
	const background = getBackgroundPage();

	const userData = useRequest(
		() => reiverrApi.users.getMovieUserData(get(user)?.id as string, tmdbId).then((r) => r.data),
		{
			refresher: movieUserDataRefresher,
			key: tmdbId
		}
	);

	const tmdbMovie = useRequest(() => tmdbApi.getMovieFull(Number(tmdbId)));

	const libraryStore = useUserLibrary('movie', tmdbId, userData);
	const isWatchedStore = useIsWatched({
		userData,
		toggleFn: (userId, watched) =>
			reiverrApi.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
				watched
			})
	});
	const progress = derived(userData, ($userData) => $userData?.playState?.progress ?? 0);

	const getVideoProps = async () => {
		const tmdbMovieData = get(tmdbMovie);

		return {
			tmdbId,
			progress: get(progress),
			title: tmdbMovieData?.title ?? 'Unknown',
			subtitle: tmdbMovieData?.release_date
				? String(new Date(tmdbMovieData.release_date).getFullYear())
				: undefined
		};
	};

	const autoplay = useAutoplay({
		tmdbId,
		playStream
	});

	async function playStream(options: {
		source: MediaSourceDto;
		streamId: string;
		season?: number;
		episode?: number;
	}) {
		const { source, streamId } = options;

		const tmdbMovieData = get(tmdbMovie);

		return background?.playMedia({
			source,
			streamId,
			tmdbId,
			progress: get(progress),
			title: tmdbMovieData?.title ?? 'Unknown',
			subtitle: tmdbMovieData?.release_date
				? String(new Date(tmdbMovieData.release_date).getFullYear())
				: 'Unknown'
		});
	}

	return {
		tmdbId,
		...libraryStore,
		...isWatchedStore,
		...autoplay,
		playStream,
		tmdbMovie: { subscribe: tmdbMovie.promise.subscribe },
		progress,
		getVideoProps,
		// handleAutoplay: async () => {
		// 	const { streamId, source } = await getAutoplayStream({ tmdbId });

		// 	if (!streamId || !source) {
		// 		createErrorNotification('Autoplay failed', 'No stream found');
		// 		return;
		// 	}

		// 	background?.setVideo({
		// 		id: Symbol(),
		// 		component: TmdbVideoPlayer,
		// 		props: {
		// 			...getVideoProps(),
		// 			streamId,
		// 			source
		// 		},
		// 		mediaId: tmdbId
		// 	});

		// 	background?.focus();
		// },
		// handleOpenStreamSelector: async () => {
		// 	createModal(StreamSelectorModal, {
		// 		getStreams: (s) => getStreams(s, tmdbId),
		// 		selectStream: (source, stream) => {
		// 			background?.setVideo({
		// 				id: Symbol(),
		// 				component: TmdbVideoPlayer,
		// 				props: {
		// 					...getVideoProps(),
		// 					streamId: stream.streamId,
		// 					source
		// 				},
		// 				mediaId: tmdbId
		// 			});

		// 			background?.focus();
		// 		}
		// 	});
		// },
		unsubscribe: () => {
			userData.unsubscribe();
			tmdbMovie.unsubscribe();
		}
	};
}

export function useEpisodeUserData(tmdbId: string, season: number, episode: number) {
	const background = getBackgroundPage();

	const userData = useRequest(
		() =>
			reiverrApi.users
				.getEpisodeUserData(get(user)?.id as string, tmdbId, season, episode)
				.then((r) => r.data),
		{
			refresher: episodeUserDataRefresher,
			key: `${tmdbId}-${season}-${episode}`
		}
	);

	const tmdbEpisode = useRequest(() =>
		tmdbApi.v3.tvEpisodeDetails(Number(tmdbId), season, episode).then((r) => r.data)
	);

	const canStreamStore = useCanStream();
	const isWatchedStore = useIsWatched({
		userData,
		toggleFn: (userId, watched) =>
			reiverrApi.users
				.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
					watched
				})
				.finally(() => seriesUserDataRefresher.refresh(tmdbId))
	});
	const progress = derived(userData, ($userData) => $userData?.playState?.progress ?? 0);

	const getVideoProps = async () => {
		const tmdbEpisodeData = get(tmdbEpisode);

		const tmdbSeries = await tmdbApi.getSeriesFull(Number(tmdbId));

		return {
			tmdbId,
			season,
			episode,
			progress: get(progress),
			title: tmdbEpisodeData?.name ?? 'Unknown',
			subtitle: tmdbSeries?.name ?? 'Unknown'
		};
	};

	return {
		...canStreamStore,
		...isWatchedStore,
		tmdbEpisode: { subscribe: tmdbEpisode.promise.subscribe },
		progress,
		handleAutoplay: async () => {
			// getAutoplayStream({ tmdbId, season, episode, progress: get(progress) });
			const { streamId, source } = await getAutoplayStream({ tmdbId, season, episode });

			if (!streamId || !source) {
				createErrorNotification('Autoplay failed', 'No stream found');
				return;
			}

			background?.setVideo({
				id: Symbol(),
				component: TmdbVideoPlayer,
				props: {
					...(await getVideoProps()),
					streamId,
					source
				},
				mediaId: tmdbId
			});

			background?.focus();
		},
		handleOpenStreamSelector: async () => {
			// createModal(StreamSelectorModal, {
			// 	getStreams: (s) => getStreams(s, tmdbId, season, episode),
			// 	selectStream: async (source, stream) => {
			// 		background?.setVideo({
			// 			id: Symbol(),
			// 			component: TmdbVideoPlayer,
			// 			props: {
			// 				...(await getVideoProps()),
			// 				streamId: stream.streamId,
			// 				source
			// 			},
			// 			mediaId: tmdbId
			// 		});
			// 		background?.focus();
			// 	}
			// });
		},
		unsubscribe: () => {
			userData.unsubscribe();
			tmdbEpisode.unsubscribe();
		}
	};
}

export const TITLE_USER_DATA_CONTEXT = 'title-user-data-context';

export const seriesUserDataContext = createStoreContext(
	TITLE_USER_DATA_CONTEXT,
	useSeriesUserData,
	{
		required: true
	}
);

export const movieUserDataContext = createStoreContext(TITLE_USER_DATA_CONTEXT, useMovieUserData, {
	required: true
});
