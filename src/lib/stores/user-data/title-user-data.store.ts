import {
	getBackgroundPage,
	type BackgroundPage
} from '$lib/components/GlobalBackground/BackgroundStack';
import { createModal } from '$lib/components/Modal/modal.store';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import TmdbVideoPlayer from '$lib/components/VideoPlayer/TmdbVideoPlayer.svelte';
import StreamSelectorModal from '$lib/pages/TitlePages/StreamSelectorModal.svelte';
import { createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import type {
	MediaSourceDto,
	StreamBaseDto,
	StreamCandidateDto,
	TmdbItemDto
} from '../../apis/reiverr/reiverr.openapi';
import {
	derviedRequest,
	episodeUserDataRefresher,
	libraryRefresher,
	movieUserDataRefresher,
	seriesUserDataRefresher,
	useRequest
} from '../data.store';
import { reiverrApi, tmdbApi, user } from '../user.store';
import { useUserLibrary } from './library.store';
import { useIsWatched } from './is-watched.store';
import type { ComponentProps } from 'svelte';

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

function usePlayback(options: {
	tmdbId: string;
	season?: number;
	episode?: number;
	getVideoProps: () => Promise<
		Pick<ComponentProps<TmdbVideoPlayer>, 'tmdbId' | 'title'> | undefined
	>;
}) {
	const { tmdbId, season, episode, getVideoProps } = options;
	const background = getBackgroundPage();

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

		return playStream(source, stream.streamId);
	}

	async function playStream(source: MediaSourceDto, streamId: string) {
		const props = await getVideoProps();

		if (!props) {
			createErrorNotification('Could not find video props');
			return;
		}

		background?.setVideo({
			id: Symbol(),
			component: TmdbVideoPlayer,
			props: {
				...props,
				streamId,
				source
			}
		});

		background?.focus();
	}

	return {
		autoplayCandidate: { subscribe: autoplayStore.subscribe },
		autoplayStream,
		playStream
	};
}

function useCanStream() {
	const canStream = writable(true);

	return {
		canStream
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

	// const episodeData = derviedRequest(
	// 	[userDataRequest, tmdbSeriesRequest],
	// 	async ([userData, tmdbSeries]) => {
	// 		if (!tmdbSeries) return;

	// 		let nextEpisode: EpisodeData | undefined;
	// 		const episodesData: EpisodeData[] = [];

	// 		let foundNext = false;
	// 		const lastWatchedPlayState = userData?.playStates?.filter((p) => p.watched).pop();
	// 		for (let season = 1; season <= (tmdbSeries.number_of_seasons ?? 0); season++) {
	// 			const s = tmdbSeries.seasons?.find((s) => s.season_number === season);
	// 			for (let episode = 1; episode <= (s?.episode_count ?? 0); episode++) {
	// 				const ep = userData?.playStates?.find(
	// 					(p) => p.season === season && p.episode === episode
	// 				);
	// 				const upcoming = !s?.air_date || new Date(s.air_date) > new Date();
	// 				if (
	// 					!foundNext &&
	// 					((lastWatchedPlayState?.season ?? 0) < season ||
	// 						((lastWatchedPlayState?.season ?? 0) === season &&
	// 							(lastWatchedPlayState?.episode ?? 0) < episode))
	// 				) {
	// 					nextEpisode = {
	// 						season,
	// 						episode,
	// 						progress: ep?.progress ?? 0,
	// 						watched: ep?.watched ?? false,
	// 						upcoming
	// 					};
	// 					foundNext = true;
	// 				}
	// 				episodesData.push({
	// 					season,
	// 					episode,
	// 					watched: ep?.watched ?? false,
	// 					progress: ep?.progress ?? 0,
	// 					upcoming
	// 				});
	// 			}
	// 		}

	// 		return {
	// 			nextEpisode,
	// 			episodesData
	// 		};
	// 	}
	// );

	derived([userDataRequest, tmdbSeriesRequest], (_) => _).subscribe(([userData, tmdbSeries]) => {
		if (!tmdbSeries) return;

		const episodesData: EpisodeData[] = [];
		let foundNext = false;
		const lastWatchedPlayState = userData?.playStates?.filter((p) => p.watched).pop();
		for (let season = 1; season <= (tmdbSeries.number_of_seasons ?? 0); season++) {
			const s = tmdbSeries.seasons?.find((s) => s.season_number === season);
			for (let episode = 1; episode <= (s?.episode_count ?? 0); episode++) {
				const ep = userData?.playStates?.find((p) => p.season === season && p.episode === episode);
				const upcoming = !s?.air_date || new Date(s.air_date) > new Date();
				if (
					!foundNext &&
					((lastWatchedPlayState?.season ?? 0) < season ||
						((lastWatchedPlayState?.season ?? 0) === season &&
							(lastWatchedPlayState?.episode ?? 0) < episode))
				) {
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

	const mediaPlayback = usePlayback({
		tmdbId,
		season: get(nextEpisode)?.season,
		episode: get(nextEpisode)?.episode,
		getVideoProps
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

	async function getVideoProps() {
		const tmdbSeriesData = get(tmdbSeriesRequest);
		const { season, episode, progress } = get(nextEpisode) ?? {};

		if (season === undefined || episode === undefined) {
			createErrorNotification('Could not find next episode');
			return;
		}

		const tmdbEpisode = await tmdbApi.v3
			.tvEpisodeDetails(Number(tmdbId), season, episode)
			.then((r) => r.data);

		return {
			tmdbId,
			season,
			episode,
			progress: progress ?? 0,
			title: tmdbEpisode?.name ?? 'Unknown',
			subtitle: tmdbSeriesData?.name ?? 'Unknown'
		};
	}

	return {
		tmdbId,
		tmdbSeries: tmdbSeriesRequest.promise,
		...libraryStore,
		...mediaPlayback,
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
	const isWatchedStore = useIsWatched(userData, (userId, watched) =>
		reiverrApi.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
			watched
		})
	);
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

	const mediaPlayback = usePlayback({
		tmdbId,
		getVideoProps
	});

	return {
		tmdbId,
		...libraryStore,
		...isWatchedStore,
		...mediaPlayback,
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
	const isWatchedStore = useIsWatched(userData, (userId, watched) =>
		reiverrApi.users
			.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
				watched
			})
			.finally(() => seriesUserDataRefresher.refresh(tmdbId))
	);
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
			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId, season, episode),
				selectStream: async (source, stream) => {
					background?.setVideo({
						id: Symbol(),
						component: TmdbVideoPlayer,
						props: {
							...(await getVideoProps()),
							streamId: stream.streamId,
							source
						},
						mediaId: tmdbId
					});

					background?.focus();
				}
			});
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
