import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { betterSubscribe, createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { useSeriesContext } from './series-data.store';
import { reiverrApi, user } from '../user.store';

export const useEpisodeContext = (tmdbId: string, season: number, episode: number) =>
	createStoreContext(`episode-${tmdbId}-s${season}e${episode}`, () =>
		useEpisodeData(tmdbId, season, episode)
	);

function useEpisodeData(tmdbId: string, season: number, episode: number) {
	// const previous = useEpisodeContext(tmdbId).getContext();

	const componentStack = useComponentStack();

	const seriesData = useSeriesContext(tmdbId).getContext(true);

	const isWatched = writable(false);
	const progress = writable(0);
	const unsubscribe = betterSubscribe(seriesData.userData.data, (userData, unsub) => {
		if (userData) unsub();
		const ep = userData?.playStates?.find((p) => p.season === season && p.episode === episode);

		isWatched.set(ep?.watched ?? false);
		progress.set(ep?.progress ?? 0);
	});

	const episodeData = derived(seriesData.seriesData.promise, (p) =>
		p.then((data) =>
			data?.seasons
				?.map((s) => s.episodes)
				.flat()
				.find((e) => e?.season_number === season && e?.episode_number === episode)
		)
	);

	async function setIsWatched(watched: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Set watched: No user ID');
			return;
		}

		const success = await reiverrApi.users
			.updateEpisodePlayStateByTmdbId(userId, tmdbId, season, episode, {
				watched
			})
			.then((r) => r.status >= 200 && r.status < 300);

		if (success) {
			isWatched.set(watched);
			return setUserDataStale();
		}
	}

	function setUserDataStale() {
		// previous.setStale?.();
		return seriesData.setStale();
	}

	return {
		componentStack,
		episodeData,
		isWatched,
		progress,
		setIsWatched,
		setStale: setUserDataStale,
		unsubscribe: () => {
			// movieData.unsubscribeEarly();
			// userData.unsubscribeEarly();
			unsubscribe();
		}
	};
}
