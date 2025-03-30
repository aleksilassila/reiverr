import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
import { createModal } from '$lib/components/Modal/modal.store';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import TmdbVideoPlayer from '$lib/components/VideoPlayer/TmdbVideoPlayer.svelte';
import StreamSelectorModal from '$lib/pages/TitlePages/StreamSelectorModal.svelte';
import { derived, get, writable, type Readable } from 'svelte/store';
import type {
	MediaSourceDto,
	MovieUserDataDto,
	SeriesUserDataDto,
	StreamCandidateDto
} from '../apis/reiverr/reiverr.openapi';
import {
	episodeUserDataRefresher,
	libraryRefresher,
	movieUserDataRefresher,
	seriesUserDataRefresher,
	useRequest
} from './data.store';
import { reiverrApi, tmdbApi, user } from './user.store';

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
				.getEpisodeStreams(source.id, tmdbId, season, episode)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => [])
		: reiverrApi.sources
				.getMovieStreams(source.id, tmdbId)
				.then((r) => r.data?.candidates ?? [])
				.catch((e) => []);
}

async function getAutoplayStream(options: { tmdbId: string; season?: number; episode?: number }) {
	const { tmdbId, season, episode } = options;

	const awaitedStreams = await getAllStreams(tmdbId, season, episode);

	const firstSource = awaitedStreams.find((p) => p.streams.length > 0);
	const source = firstSource?.source;
	const key = firstSource?.streams[0]?.key;

	return {
		source,
		key
	};
}

function useUserLibrary(
	mediaType: 'movie' | 'series',
	tmdbId: string,
	userData: Readable<MovieUserDataDto | SeriesUserDataDto | undefined>
) {
	const inLibrary = writable<boolean>(undefined);

	userData.subscribe((d) => {
		inLibrary.set(d?.inLibrary ?? false);
	});

	async function handleAddToLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApi.library
			.addLibraryItem(userId, tmdbId, { mediaType })
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(true);
			libraryRefresher.refreshIn(1500);
		}
	}

	async function handleRemoveFromLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Remove from library: No user ID');
			return;
		}

		const success = await reiverrApi.library
			.removeLibraryItem(userId, tmdbId)
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(false);
			libraryRefresher.refreshIn(500);
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
			libraryRefresher.refreshIn(500);
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
	const background = getBackgroundPage();

	const userDataRequest = useRequest(
		() => reiverrApi.users.getSeriesUserData(get(user)?.id as string, tmdbId).then((r) => r.data),
		{
			refresher: seriesUserDataRefresher,
			key: tmdbId
		}
	);
	const tmdbSeriesRequest = useRequest(() => tmdbApi.getSeriesFull(Number(tmdbId)));
	const libraryStore = useUserLibrary('series', tmdbId, userDataRequest);
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

	const getVideoProps = async () => {
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
	};

	return {
		tmdbSeries: tmdbSeriesRequest.promise,
		...libraryStore,
		...canStreamStore,
		nextEpisode,
		episodesUserData,
		isWatched,
		toggleIsWatched,
		handleAutoplay: async () => {
			const videoProps = await getVideoProps();

			if (!videoProps) return;

			const { season, episode } = videoProps;

			const { key, source } = await getAutoplayStream({ tmdbId, season, episode });

			if (!key || !source) {
				createErrorNotification('Autoplay failed', 'No stream found');
				return;
			}

			background?.setVideo({
				id: Symbol(),
				component: TmdbVideoPlayer,
				props: {
					...videoProps,
					key,
					source
				},
				mediaId: tmdbId
			});

			background?.focus();
		},
		handleOpenStreamSelector: async () => {
			const videoProps = await getVideoProps();

			if (!videoProps) return;

			const { season, episode } = videoProps;

			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId, season, episode),
				selectStream: (source, stream) => {
					background?.setVideo({
						id: Symbol(),
						component: TmdbVideoPlayer,
						props: {
							...videoProps,
							key: stream.key,
							source
						},
						mediaId: tmdbId
					});

					background?.focus();
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
	const canStreamStore = useCanStream();
	const isWatchedStore = useIsWatched(userData, (userId, watched) =>
		reiverrApi.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
			watched
		})
	);
	const progress = derived(userData, ($userData) => $userData?.playState?.progress ?? 0);

	const getVideoProps = () => {
		const tmdbMovieData = get(tmdbMovie);

		return {
			tmdbId,
			progress: get(progress),
			title: tmdbMovieData?.title ?? 'Unknown',
			subtitle: tmdbMovieData?.release_date
				? new Date(tmdbMovieData.release_date).getFullYear()
				: undefined
		};
	};

	return {
		...libraryStore,
		...canStreamStore,
		...isWatchedStore,
		tmdbMovie: { subscribe: tmdbMovie.promise.subscribe },
		progress,
		handleAutoplay: async () => {
			const { key, source } = await getAutoplayStream({ tmdbId });

			if (!key || !source) {
				createErrorNotification('Autoplay failed', 'No stream found');
				return;
			}

			background?.setVideo({
				id: Symbol(),
				component: TmdbVideoPlayer,
				props: {
					...getVideoProps(),
					key,
					source
				},
				mediaId: tmdbId
			});

			background?.focus();
		},
		handleOpenStreamSelector: async () => {
			createModal(StreamSelectorModal, {
				getStreams: (s) => getStreams(s, tmdbId),
				selectStream: (source, stream) => {
					background?.setVideo({
						id: Symbol(),
						component: TmdbVideoPlayer,
						props: {
							...getVideoProps(),
							key: stream.key,
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
			const { key, source } = await getAutoplayStream({ tmdbId, season, episode });

			if (!key || !source) {
				createErrorNotification('Autoplay failed', 'No stream found');
				return;
			}

			background?.setVideo({
				id: Symbol(),
				component: TmdbVideoPlayer,
				props: {
					...(await getVideoProps()),
					key,
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
							key: stream.key,
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
