import { derived, get, type Readable, writable } from 'svelte/store';
import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
import {
	tmdbApi,
	type TmdbMovieFull2,
	type TmdbSeries2,
	type TmdbSeriesFull2
} from '../apis/tmdb/tmdb-api';
import { awaitAppInitialization, reiverrApiNew, user } from './user.store';

type AwaitableStoreValue<R, T = { data?: R }> = {
	loading: boolean;
} & T;

export function _createDataFetchStore<T>(fn: () => Promise<T>) {
	const store = writable<AwaitableStoreValue<T>>({
		loading: true,
		data: undefined
	});

	async function refresh() {
		store.update((s) => ({ ...s, loading: true }));
		return awaitAppInitialization().then(() =>
			fn().then((data) => {
				store.set({ loading: false, data });
				return data;
			})
		);
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1000) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	return {
		subscribe: store.subscribe,
		send: refresh,
		refreshIn,
		promise: refresh()
	};
}

export const jellyfinItemsStore = _createDataFetchStore(() => jellyfinApi.getLibraryItems());

export const useDependantRequest = <P extends (...args: A) => Promise<any>, A extends any[], S>(
	fn: P,
	store: Readable<S>,
	subscribeFn: (store: S) => Parameters<P> | undefined
) => {
	const isLoading = writable(true);
	const r = useActionRequest<P, A>(fn);

	store.subscribe(($data) => {
		const args = subscribeFn($data);
		if (!args) return;
		r.send(...args).finally(() => isLoading.set(false));
	});

	return {
		...r,
		refresh: r.send,
		isLoading: {
			subscribe: isLoading.subscribe
		}
	};
};

export const useRequest = <P extends (...args: A) => Promise<any>, A extends any[]>(
	fn: P,
	...args: Parameters<P>
) => {
	const isLoading = writable(true);
	const r = useActionRequest<P, A>(fn);

	r.send(...args).finally(() => isLoading.set(false));

	return {
		...r,
		refresh: r.send,
		isLoading: {
			subscribe: isLoading.subscribe
		}
	};
};

export const useActionRequest = <P extends (...args: A) => Promise<any>, A extends any[]>(
	fn: P
) => {
	const request = writable<ReturnType<P>>(undefined);
	const data = writable<Awaited<ReturnType<P>> | undefined>(undefined);
	const isFetching = writable(false);

	function send(...args: Parameters<P>): ReturnType<P> {
		isFetching.set(true);
		// @ts-ignore
		const p: ReturnType<P> = fn(...args)
			.then((res) => {
				data.set(res);
				return res;
			})
			.finally(() => {
				isFetching.set(false);
			});

		request.set(p);
		return p;
	}

	return {
		promise: {
			subscribe: request.subscribe
		},
		data: {
			subscribe: data.subscribe
		},

		isFetching: {
			subscribe: isFetching.subscribe
		},
		send
	};
};

export function useRequest3<TResponse>(fn: () => Promise<TResponse>) {
	const promise = writable<Promise<TResponse>>(null!);
	const store = writable<AwaitableStoreValue<TResponse>>({
		loading: true,
		data: undefined
	});
	const isLoading = derived(store, (s) => s.loading);
	const data = derived(store, (s) => s.data);

	async function refresh() {
		const initialRequest = get(promise) === null;
		store.update((s) => ({ ...s, loading: true }));
		const p = awaitAppInitialization().then(() => {
			return fn().then((data) => {
				store.set({ loading: false, data });
				if (!initialRequest) promise.set(Promise.resolve(data));
				return data;
			});
		});
		if (initialRequest) promise.set(p);
		return p;
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1000) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	refresh();

	return {
		subscribe: data.subscribe,
		isLoading: isLoading,
		refresh,
		refreshIn,
		promise: { subscribe: promise.subscribe }
	};
}

export function useRequestsStore<TArgs extends Array<unknown>, TResponse>(
	fn: (...args: TArgs) => Promise<TResponse>
) {
	type Res = ReturnType<typeof useRequest3<TResponse>>;
	const requests: Map<string, { subscribers: symbol[]; request: Res }> = new Map();

	function getRequest(...args: TArgs): Res & { unsubscribe: () => void } {
		const id = Symbol();
		let request = requests.get(JSON.stringify(args))?.request;

		if (!request) {
			request = useRequest3(() => fn(...args));
			requests.set(JSON.stringify(args), {
				subscribers: [id],
				request
			});
		} else {
			requests.get(JSON.stringify(args))?.subscribers.push(id);
		}

		return {
			...request,
			unsubscribe: () => {
				const subscribers = requests.get(JSON.stringify(args))?.subscribers;
				const index = subscribers?.indexOf(id);
				if (index !== undefined && index !== -1) {
					subscribers?.splice(index, 1);
				}

				if (subscribers?.length === 0) {
					requests.delete(JSON.stringify(args));
				}
			}
		};
	}

	const refresh = async (...args: TArgs) => {
		const request = requests.get(JSON.stringify(args))?.request;

		if (request) {
			return request.refresh();
		}
	};

	return {
		getRequest,
		refresh
	};
}

export const tmdbMovieDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbMovie(id));
export const tmdbSeriesDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbSeries(id));

export const movieUserDataStore = useRequestsStore((id: string) =>
	reiverrApiNew.users.getMovieUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const seriesUserDataStore = useRequestsStore((id: string) =>
	reiverrApiNew.users.getSeriesUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const episodeUserDataStore = useRequestsStore(
	(id: string, season: number, episode: number) =>
		reiverrApiNew.users
			.getEpisodeUserData(get(user)?.id as string, id, season, episode)
			.then((r) => r.data)
);

export const libraryItemsDataStore = useRequestsStore(() =>
	reiverrApiNew.users
		.getLibraryItems(get(user)?.id as string)
		.then((r) =>
			r.data.items.map((i) => ({
				...i,
				metadata:
					(i.movieMetadata?.tmdbMovie as TmdbMovieFull2) ||
					(i.seriesMetadata?.tmdbSeries as TmdbSeriesFull2)
			}))
		)
		.then((i) => i.filter((i) => !!i.metadata))
);

export const mediaSourcesDataStore = useRequestsStore(() =>
		reiverrApiNew.users
			.findUserById(get(user)?.id || '')
			.then((r) => r.data.mediaSources?.sort((a, b) => a.priority - b.priority) ?? [])
);
