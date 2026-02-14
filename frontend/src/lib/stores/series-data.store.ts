import type { SeriesUserDataDto, TmdbSeriesFull } from '$lib/apis/reiverr/reiverr.openapi';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { useData } from './data.store';
import { reiverrApi, user } from './user.store';

export type EpisodeUserData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

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

export const useSeriesContext = (tmdbId: string) =>
	createStoreContext(`series-${tmdbId}`, () => useSeriesData(tmdbId));

function useSeriesData(tmdbId: string) {
	const previous = useSeriesContext(tmdbId).getContext();
	// const previousLibrary = useSeriesContext(tmdbId).getContext();
	// const previousNextUp = useSeriesContext(tmdbId).getContext();

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

		return setUserDataStale();
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
			previous.setStale?.();

			// previousLibrary.setStale?.();
			// previousNextUp.setStale?.();
		}
	}

	function setUserDataStale() {
		previous.setStale?.();
		return userData.setStale();
	}

	return {
		componentStack,
		// backgroundStack,
		seriesData,
		userData,
		inLibrary,
		isWatched,
		setInLibrary,
		setWatched,
		episodesData,
		setStale: setUserDataStale,
		unsubscribe: () => {
			seriesData.unsubscribeEarly();
			userData.unsubscribeEarly();
		}
	};
}

/**
 * DataProvider makes sure that data mutations are reflected everywhere in the component stack
 *
 * Belongs to a component, is not global. Gives access to the global data
 */
function useDataProvider() {
	const componentStack = useComponentStack();

	// function getEpisodeData(tmdbId: string, seasonNumber: number, episodeNumber: number) {
	// 	const key = `episode-${tmdbId}-${seasonNumber}-${episodeNumber}`;

	// 	if (!componentStack.hasContext(key)) {
	// 		const data = useEpisodeData(tmdbId, seasonNumber, episodeNumber);
	// 		componentStack.setContext(key, data);
	// 		return data;
	// 	}

	// 	return componentStack.getContext<EpisodeData>(key);
	// }

	return {};
}

// getLibraryPageData() {
// 	// fetch data

// 	// get or create seriesWatchStatus[]

// 	// update each from data

// 	// Return watcher for seriesWatchStatus[]
// }

// getSeriesPageData() {
// 	// fetch data

// 	// get or create seriesWatchStatus

// 	// update from data

// 	// Return watcher, mutator for seriesWatchStatus
// }

// getEpisodeData() {
// 	// changes from seriesPage (set all as watched), changes seriesPage (set as watched)
// }

// // Library page
// const {seriesWatchStatus[]} = getLibraryPageData()

// // Series page
// const {seriesWatchStatus} = getSeriesPageData()

// // Episode page

// const {episodeWatchStatus} = getEpisodeData()
