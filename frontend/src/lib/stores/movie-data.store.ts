import type { MovieUserDataDto, TmdbMovieFull } from '$lib/apis/reiverr/reiverr.openapi';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext, waitFor } from '$lib/utils';
import { tick } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { awaitAppInitialization, reiverrApi, user } from './user.store';

type DataState = 'loading' | 'refreshing' | 'ready' | 'error';

/**
 * A store for fetching data with the ability to make it stale and refetch automatically when the component page comes to front
 */
function useData<TResponse>(fetchData: () => Promise<TResponse>) {
	const componentStack = useComponentStack();

	const data = writable<TResponse | undefined>(undefined);
	const isLoading = writable(true);
	const promise = writable(
		createPromise().then((d) => {
			data.set(d);
			isLoading.set(false);
			return d;
		})
	);

	async function createPromise() {
		return awaitAppInitialization().then(() => fetchData());
	}

	let unsubToStaleWatcher: (() => void) | undefined;
	const resolves: ((v: unknown) => void)[] = [];
	function setStale(timeout = 1500) {
		const out = new Promise((resolve) => {
			let t: ReturnType<typeof setTimeout>;

			const f = (v: unknown) => {
				clearTimeout(t);
				resolve(v);
			};

			resolves.push(f);

			t = setTimeout(() => {
				resolves.splice(resolves.indexOf(f), 1).forEach((r) => r(undefined));
			}, timeout);
		});

		// Hack because hasFocusWithin is still true when new page mounts
		tick().then(() => {
			unsubToStaleWatcher?.();
			unsubToStaleWatcher = waitFor(
				componentStack.hasFocusWithin,
				(isFocused) => !!isFocused,
				() => {
					const p = fetchData();
					resolves.splice(0).forEach((r) => r(p));
					return p;
				}
			).unsubscribe;
		});

		return out;
	}

	return {
		data,
		isLoading,
		promise,
		setStale,
		unsubscribeEarly: () => {
			unsubToStaleWatcher?.();
			resolves.splice(0).forEach((r) => r(undefined));
		}
	};
}

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
