import { tick } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { tmdbApi } from '../apis/tmdb/tmdb-api';
import { awaitAppInitialization, reiverrApi, user } from './user.store';
import type { PaginatedResponseDto } from '$lib/apis/reiverr/reiverr.openapi';
import type { Action } from 'svelte/action';

type Request<TResponse> = ReturnType<typeof useRequest<TResponse>>;

export function useRequest<TResponse>(fn: () => Promise<TResponse>) {
	async function _createPromise() {
		return awaitAppInitialization().then(() => fn());
	}

	const initialPromise = _createPromise();
	const promise = writable(initialPromise);
	const isLoading = writable(true);
	const data = writable<TResponse | undefined>(undefined);
	initialPromise.then((d) => {
		data.set(d);
		isLoading.set(false);
	});

	async function refresh() {
		isLoading.set(true);

		return _createPromise().then((d) => {
			data.set(d);
			promise.set(Promise.resolve(d));
			isLoading.set(false);
			return d;
		});
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1500) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	return {
		subscribe: data.subscribe,
		isLoading: { subscribe: isLoading.subscribe },
		promise: { subscribe: promise.subscribe },
		refresh,
		refreshIn
	};
}

export function useDerivedRequest<TResponse, TResponse2>(
	request: Request<TResponse2>,
	fn: (r: TResponse2) => Promise<TResponse>
): Request<TResponse> {
	const isLoading = writable(true);
	const data = writable<TResponse | undefined>(undefined);
	const promise = derived(request.promise, async (p) => {
		isLoading.set(true);

		return p
			.then((r) => fn(r))
			.then((d) => {
				data.set(d);
				return d;
			})
			.finally(() => {
				isLoading.set(false);
			});
	});

	return {
		subscribe: data.subscribe,
		isLoading: { subscribe: isLoading.subscribe },
		promise: { subscribe: promise.subscribe },
		refresh: async () => {
			await request.refresh();
			await tick();
			return get(promise);
		},
		refreshIn: async (ms?: number) => {
			await request.refreshIn(ms);
			await tick();
			return get(promise);
		}
	};
}

type RequestStoreRequest<TResponse> = Request<TResponse> & { unsubscribe: () => void };

export function useRequestsStore<TArgs extends Array<unknown>, TResponse>(
	fn: (...args: TArgs) => Promise<TResponse>,
	options: { persistant?: boolean } = {}
) {
	const requests: Map<string, { subscribers: symbol[]; request: Request<TResponse> }> = new Map();

	function subscribe(...args: TArgs): RequestStoreRequest<TResponse> {
		const id = Symbol();
		let request = requests.get(JSON.stringify(args))?.request;

		if (!request) {
			request = useRequest(() => fn(...args));
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
				const index = subscribers?.indexOf(id) ?? -1;
				if (index !== -1) {
					subscribers?.splice(index, 1);
				}

				if (subscribers?.length === 0 && options.persistant !== true) {
					requests.delete(JSON.stringify(args));
					console.log('deleting request', args);
				}
			}
		};
	}

	function _get(...args: TArgs) {
		const res = subscribe(...args);
		res.unsubscribe();
		return get(res.promise);
	}

	const refresh = async (...args: TArgs) => {
		const request = requests.get(JSON.stringify(args))?.request;

		if (request) {
			return request.refresh();
		}
	};

	const refreshIn = async (ms: number, ...args: TArgs) => {
		const request = requests.get(JSON.stringify(args))?.request;

		if (request) {
			return request.refreshIn(ms);
		}
	};

	return {
		subscribe,
		get: _get,
		refresh,
		refreshIn
	};
}

export function useDerivedRequestsStore<TArgs extends Array<unknown>, TResponse, TResponse2>(
	dataStore: ReturnType<typeof useRequestsStore<TArgs, TResponse>>,
	fn: (res: TResponse) => Promise<TResponse2>
) {
	type Res = ReturnType<typeof useRequest<TResponse2>>;
	function subscribe(...args: TArgs): RequestStoreRequest<TResponse2> {
		const request = dataStore.subscribe(...args);
		const derivedRequest = useDerivedRequest(request, fn);

		return {
			...derivedRequest,
			unsubscribe: request.unsubscribe
		};
	}

	return {
		...dataStore,
		subscribe
	};
}

export function usePaginatedRequest<TResponseItem>(
	fn: (page: number) => Promise<{ items: TResponseItem[] } & PaginatedResponseDto>,
	options: { initialPage?: number; loadFirstPage?: boolean } = {}
) {
	const initialPage = options.initialPage ?? 1;

	let requestId = Symbol();
	const nextPage = writable(initialPage);
	const loadingPage = writable(initialPage - 1);
	let hasNextPage = true;
	const data = writable<TResponseItem[]>([]);
	const isLoading = writable(false);
	let promise: Promise<unknown> | undefined;

	if (options.loadFirstPage !== false) requestNextPage();

	async function requestNextPage() {
		if (get(loadingPage) === get(nextPage)) return;
		if (!hasNextPage) return;

		loadingPage.update((p) => p + 1);

		const currentPage = get(nextPage);
		const id = requestId;

		if (promise) await promise;

		if (!hasNextPage) return;

		isLoading.set(true);
		promise = fn(currentPage)
			.then((res) => {
				if (id !== requestId) return;

				if (res.items.length < res.itemsPerPage) {
					hasNextPage = false;
				}

				data.update((d) => [...d, ...res.items]);
			})
			.finally(() => {
				if (id !== requestId) return;

				nextPage.update((p) => p + 1);
				isLoading.set(false);
			});
	}

	const interactionObserver: Action = (node) => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						requestNextPage();
					}
				});
			},
			{
				threshold: 0.1
			}
		);
		observer.observe(node);

		return {
			destroy() {
				observer.unobserve(node);
			}
		};
	};

	function reset(resetOptions: { loadFirstPage?: boolean } = { loadFirstPage: false }) {
		nextPage.set(initialPage);
		loadingPage.set(initialPage - 1);
		hasNextPage = true;
		data.set([]);
		promise = undefined;
		isLoading.set(false);
		requestId = Symbol();
		if (resetOptions.loadFirstPage !== false) requestNextPage();
		else if (options.loadFirstPage !== false) requestNextPage();
	}

	return {
		data: {
			subscribe: data.subscribe
		},
		isLoading: {
			subscribe: isLoading.subscribe
		},
		requestNextPage,
		interactionObserver,
		reset
	};
}

export const tmdbMovieDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbMovie(id));
export const tmdbSeriesDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbSeries(id));
export const tmdbEpisodeDataStore = useRequestsStore(
	(tmdbId: number, season: number, episode: number) => tmdbApi.getEpisode(tmdbId, season, episode)
);

export const movieUserDataStore = useRequestsStore((id: string) =>
	reiverrApi.users.getMovieUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const seriesUserDataStore = useRequestsStore((id: string) =>
	reiverrApi.users.getSeriesUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const episodeUserDataStore = useRequestsStore(
	(id: string, season: number, episode: number) =>
		reiverrApi.users
			.getEpisodeUserData(get(user)?.id as string, id, season, episode)
			.then((r) => r.data)
);

export const libraryItemsDataStore = useRequestsStore(
	() => reiverrApi.library.getMyList(get(user)?.id as string).then((r) => r.data.items),
	{ persistant: true }
);

// const continueWatchingDataStore = useDerivedRequestsStore(
// 	libraryItemsDataStore,
// 	async (libraryData) => {
// 		if (!libraryData) return [];

// 		const movies = libraryData.filter(
// 			(i) => i.mediaType === 'Movie' && i.playStates?.length && !i.watched
// 		);

// 		movies.sort((a, b) => {
// 			const aMax = Math.max(
// 				...(a.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
// 			);
// 			const bMax = Math.max(
// 				...(b.playStates?.map((p) => new Date(p.lastPlayedAt).getTime()) || [0])
// 			);

// 			return bMax - aMax;
// 		});

// 		return movies.map((i) => i.metadata);
// 	}
// );

export const mediaSourcesDataStore = useRequestsStore(() =>
	reiverrApi.users
		.findUserById(get(user)?.id || '')
		.then((r) => r.data.mediaSources?.sort((a, b) => a.priority - b.priority) ?? [])
);
