import type { MovieStatusDto } from '$lib/apis/reiverr/reiverr.openapi';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { get, writable } from 'svelte/store';
import { continueWatchingMoviesContext } from './continue-watching-data.store';
import { useData, useStaleable } from './data.store';
import { libraryContext } from './library-data.store';
import { reiverrApi, user } from '../user.store';

export const useMovieContext = (tmdbId: string) =>
	createStoreContext(`movie-${tmdbId}`, () => useMovieData(tmdbId));

function useMovieData(tmdbId: string) {
	const previous = useMovieContext(tmdbId).getContext();
	const previousContinueWatching = continueWatchingMoviesContext.getContext();
	const previousLibrary = libraryContext.getContext();

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

		inLibrary.set(data.inMyList);
		isWatched.set(data.playState?.watched ?? false);
		progress.set(data.playState?.progress ?? 0);

		return data;
	});

	// The requests view refreshes the status periodically, so a failure is reported once
	let statusFailed = false;
	const statusData = useData(async (): Promise<MovieStatusDto> => {
		const status = await reiverrApi.library
			.getMovieStatus(tmdbId)
			.then((r) => r.data)
			.catch((e) => {
				if (!statusFailed) {
					createErrorNotification(
						'Could not load the request',
						e?.response?.data?.message ?? e?.message ?? String(e)
					);
				}
				statusFailed = true;
				throw e;
			});
		statusFailed = false;

		return status;
	});

	async function setWatched(watched: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Set watched: No user ID');
			return;
		}

		await reiverrApi.users.updateMoviePlayState(userId, tmdbId, {
			watched
		});

		return invalidateUserData();
	}

	async function setRequested(requested: boolean) {
		const userId = get(user)?.id as string;

		await (requested
			? reiverrApi.requests.createMovieRequest(userId, tmdbId)
			: reiverrApi.requests.deleteMovieRequest(userId, tmdbId));

		return statusData.update();
	}

	async function setInLibrary(state: boolean) {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApi.myList
			.setMyListItem(userId, tmdbId, { mediaType: 'movie', inMyList: state })
			.then((r) => r.data.success);

		if (success) {
			inLibrary.set(state);
			previous.inLibrary?.set(state);
			previousContinueWatching.setStale?.();
		}
	}

	function invalidateUserData() {
		previous.setStale?.();
		previousContinueWatching.setStale?.();
		previousLibrary.setStale?.();
		// The rule of the movie follows the watched state
		statusData.update();
		return userData.update();
	}

	const { setStale, unsubscribe } = useStaleable(() => invalidateUserData());

	return {
		componentStack,
		movieData,
		statusData,
		inLibrary,
		isWatched,
		progress,
		setInLibrary,
		setWatched,
		setRequested,
		setStale,
		unsubscribe: () => {
			unsubscribe();
		}
	};
}
