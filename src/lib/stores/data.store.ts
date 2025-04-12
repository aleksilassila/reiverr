import type { PaginatedResponseDto } from '$lib/apis/reiverr/reiverr.openapi';
import { getStackRouterPage } from '$lib/components/StackRouter/StackRouter';
import type { Action } from 'svelte/action';
import { derived, get, writable, type Readable } from 'svelte/store';
import { awaitAppInitialization } from './user.store';

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

type StoreValue<T extends Readable<unknown>> = T extends Readable<infer U> ? U : never;
type MapRequestsToPromises<T> = {
	[K in keyof T]: T[K] extends Request<unknown> ? Awaited<StoreValue<T[K]['promise']>> : never;
};

// type RequestPromise<T extends Request<K>, K> = T['promise'];

// type Asd<TReturn, A extends Array<Request<unknown>>> = (
// 	a: MapRequestsToPromises<A>
// ) => Promise<TReturn>;

export function derviedRequest<const R extends Array<Request<unknown>>, TReturn>(
	requests: R,
	fn: (a: MapRequestsToPromises<R>) => Promise<TReturn>
) {
	const unsubs: Array<() => void> = [];
	const data = writable<TReturn | undefined>(undefined);
	let id = Symbol();
	const promise = derived(
		requests.map((r) => r.promise),
		async (promises) => {
			id = Symbol();
			const currentId = id;

			const values = await Promise.all(promises);
			if (currentId !== id) return;
			const res = await fn(values as any);
			if (currentId !== id) return;
			data.set(res);
			return res;
		}
	);

	return {
		subscribe: data.subscribe,
		promise: {
			subscribe: promise.subscribe
		},
		unsubscribe: () => unsubs.forEach((unsub) => unsub())
	};
}

// derviedRequest([{} as Request<number>, {} as Request<string>], async ([a, b]) => {
// 	a?.subscribe((a) => a);
// });

// async function f<TReturn>(a: Array<Request<unknown>['promise']>): Promise<TReturn> {}

// declare type Requests =
// 	| Request<any>
// 	| [Request<any>, ...Array<Request<any>>]
// 	| Array<Request<any>>;
// declare type RequestsValues<T> = T extends Request<infer U>
// 	? U
// 	: {
// 			[K in keyof T]: T[K] extends Request<infer U> ? U : never;
// 	  };

// export function derviedRequest<TResponse, R extends Requests>(requests: R, fn: (values: RequestsValues<R>) => Promise<TResponse>) {
// 	const unsubs: Array<() => void> = [];
// 	const data = writable<TResponse | undefined>(undefined);
// 	let id = Symbol();

// 	derived(Array.isArray(requests) ? requests.map(r => r.promise) : [requests.promise], async (promises) => {
// 		let currentId = id;
// 		const values = await Promise.all(promises);
// 		if (currentId !== id) return;

// 	})

// 	return {
// 		unsubscribe: () => unsubs.forEach((unsub) => unsub()),
// 	}
// }

// type Asd<T> = {
// 	[K in keyof T]: T[K] extends Request<infer U> ? U : never;
// };
// export function test<T extends Request<unknown>[]>(requests: T, fn: (p: Asd<T>) => Promise<unknown>) {
// 	fn(requests);
// }

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

/**
 * Useful for infinite scroll. By default, loads the initial page automatically.
 */
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

	let requestId: symbol = Symbol();
	let loadedPage = 0;
	let requestedPage = 0;
	let hasNextPage = true;
	const data = writable<TResponseItem[]>([]);
	const isLoading = writable(false);

	if (options.loadOnInit !== false) load();

	async function requestNextPage() {
		return requestUntil(loadedPage + 1);
	}

	async function requestUntil(page: number) {
		const id = requestId;
		requestedPage = Math.max(page, requestedPage);

		if (get(isLoading) || !hasNextPage) return;

		isLoading.set(true);
		let i = loadedPage + 1;
		while (i <= requestedPage) {
			const res = await fn(i).catch(() => {});
			if (id !== requestId) return;

			loadedPage = i;

			if (res?.items?.length) {
				if (i === initialPage) {
					data.set(res.items);
				} else {
					data.update((d) => [...d, ...res.items]);
				}
			}

			if (!res?.items || res.items.length < res.itemsPerPage) {
				hasNextPage = false;
				break;
			}

			i++;
		}
		isLoading.set(false);
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

		requestId = Symbol();
		loadedPage = 0;
		requestedPage = 0;
		hasNextPage = true;
		isLoading.set(false);

		if (!lazy) data.set([]);
		return requestUntil(initialPage);
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
		requestUntil,
		interactionObserver,
		load,
		unsubscribe: () => unsubscribeRefresher()
	};
}

export const movieUserDataRefresher = new Refresher();
export const seriesUserDataRefresher = new Refresher();
export const episodeUserDataRefresher = new Refresher();
export const libraryRefresher = new Refresher();
