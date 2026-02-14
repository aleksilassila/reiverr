import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { get, writable } from 'svelte/store';
import { useData } from './data.store';
import { reiverrApi, user } from './user.store';

export const useMovieContext = (tmdbId: string) =>
	createStoreContext(`movie-${tmdbId}`, () => useMovieData(tmdbId));

function useMovieData(tmdbId: string) {
	const previous = useMovieContext(tmdbId).getContext();

	const componentStack = useComponentStack();

	const inLibrary = writable(false);
	const isWatched = writable(false);
	const progress = writable(0);

	const movieData = useData(async () => {
		const data = await reiverrApi.metadata.getMovie(tmdbId).then((r) => r.data.tmdbMovie);
		return data;
	});

	const userData = useData(async () => {
		const data = await reiverrApi.users
			.getMovieUserData(get(user)?.id as string, tmdbId)
			.then((r) => r.data);

		inLibrary.set(data.inLibrary);
		isWatched.set(data.playState?.watched ?? false);
		progress.set(data.playState?.progress ?? 0);

		return data;
	});

	async function setWatched(watched: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Set watched: No user ID');
			return;
		}

		await reiverrApi.users.updateMoviePlayStateByTmdbId(userId, tmdbId, {
			watched
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
			.updateLibraryItem(userId, tmdbId, { mediaType: 'movie', inLibrary: state })
			.then((r) => r.data.success);

		if (success) {
			inLibrary.set(state);
			previous.inLibrary?.set(state);
		}
	}

	function setUserDataStale() {
		previous.setStale?.();
		return userData.setStale();
	}

	return {
		componentStack,
		movieData,
		inLibrary,
		isWatched,
		progress,
		setInLibrary,
		setWatched,
		setStale: setUserDataStale,
		unsubscribe: () => {
			movieData.unsubscribeEarly();
			userData.unsubscribeEarly();
		}
	};
}
