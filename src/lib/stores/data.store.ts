import { tick } from 'svelte';
import { derived, get, writable, type Readable } from 'svelte/store';
import { tmdbApi } from '../apis/tmdb/tmdb-api';
import { awaitAppInitialization, reiverrApi, user } from './user.store';
import type { PaginatedResponseDto } from '$lib/apis/reiverr/reiverr.openapi';
import type { Action } from 'svelte/action';
import { getStackRouterPage } from '$lib/components/StackRouter/StackRouter';

type Request<TResponse> = ReturnType<typeof useRequest<TResponse>>;
// type Refresher = ReturnType<typeof createRefresher>;

export class Refresher {
	private subscribers: {
		key?: string;
		isActive?: Readable<boolean>;
		unsubscribe?: () => void;
		refresh: () => Promise<unknown>;
		refreshIn: (ms: number) => Promise<unknown>;
	}[] = [];

	subscribe(options: {
		isActive?: Readable<boolean>;
		refresh: () => Promise<unknown>;
		refreshIn: (ms: number) => Promise<unknown>;
		key?: string;
	}) {
		const subscriber = {
			key: options.key,
			isActive: options.isActive,
			refresh: options.refresh,
			refreshIn: options.refreshIn,
			unsubscribe: () => {}
		};

		this.subscribers.push(subscriber);

		return () => {
			subscriber.unsubscribe?.();
			this.subscribers = this.subscribers.filter((s) => s !== subscriber);
		};
	}

	refresh(key?: string): Promise<unknown> {
		const promises = this.subscribers.map((s) => {
			if (!key || key === s.key) {
				if (s.unsubscribe) s.unsubscribe();

				if (s.isActive && !get(s.isActive)) {
					s.unsubscribe = s.isActive.subscribe((isActive) => {
						if (isActive) {
							s.refresh();
							s.unsubscribe?.();
						}
					});
				} else {
					return s.refresh();
				}
			}

			return Promise.resolve();
		});

		return Promise.all(promises);
	}

	refreshIn(ms: number, key?: string): Promise<unknown> {
		const promises = this.subscribers.map((s) => {
			if (!key || key === s.key) {
				if (s.unsubscribe) s.unsubscribe();

				if (s.isActive && !get(s.isActive)) {
					s.unsubscribe = s.isActive.subscribe((isActive) => {
						if (isActive) {
							s.refreshIn(ms);
							s.unsubscribe?.();
						}
					});
				} else {
					return s.refreshIn(ms);
				}
			}

			return Promise.resolve();
		});

		return Promise.all(promises);
	}
}

export function useRequest<TResponse>(
	fn: () => Promise<TResponse>,
	options: {
		refresher?: Refresher;
		key?: string;
	} = {}
) {
	async function _createPromise() {
		return awaitAppInitialization().then(() => fn());
	}

	const { hasFocus: isActive } = getStackRouterPage();
	const { refresher, key } = options;

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

	let unsubscribeRefresher = () => {};
	if (refresher) {
		unsubscribeRefresher = refresher.subscribe({ isActive, refresh, refreshIn, key });
	}

	return {
		subscribe: data.subscribe,
		isLoading: { subscribe: isLoading.subscribe },
		promise: { subscribe: promise.subscribe },
		refresh,
		refreshIn,
		unsubscribe: () => unsubscribeRefresher()
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

export function usePaginatedRequest<TResponseItem>(
	fn: (page: number) => Promise<{ items: TResponseItem[] } & PaginatedResponseDto>,
	options: {
		initialPage?: number;
		loadOnInit?: boolean;
		refresher?: Refresher;
		key?: string;
	} = {}
) {
	const { hasFocus: isActive } = getStackRouterPage();
	const { refresher, key, initialPage = 1 } = options;

	let requestId = Symbol();
	const nextPage = writable(initialPage);
	const loadingPage = writable(initialPage - 1);
	let hasNextPage = true;
	const data = writable<TResponseItem[]>([]);
	const isLoading = writable(false);
	let promise: Promise<unknown> | undefined;

	if (options.loadOnInit !== false) load();

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

				if (currentPage === initialPage) {
					data.set(res.items);
				} else {
					data.update((d) => [...d, ...res.items]);
				}
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

	async function load(options: { lazy?: boolean } = {}) {
		const { lazy = false } = options;

		nextPage.set(initialPage);
		loadingPage.set(initialPage - 1);
		hasNextPage = true;
		promise = undefined;
		isLoading.set(false);
		requestId = Symbol();

		if (!lazy) data.set([]);
		return requestNextPage();
	}

	let updateTimeout: ReturnType<typeof setTimeout>;
	function loadIn(ms: number) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				load().then(resolve);
			}, ms);
		});
	}

	let unsubscribeRefresher = () => {};
	if (refresher) {
		unsubscribeRefresher = refresher.subscribe({
			isActive,
			refresh: load,
			refreshIn: loadIn,
			key
		});
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
		load,
		unsubscribe: () => unsubscribeRefresher()
	};
}

export const movieUserDataRefresher = new Refresher();
export const seriesUserDataRefresher = new Refresher();
export const episodeUserDataRefresher = new Refresher();
export const libraryRefresher = new Refresher();
