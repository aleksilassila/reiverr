import type { PaginatedResponseDto } from '$lib/apis/reiverr/reiverr.openapi';
import type { Action } from 'svelte/action';
import { derived, get, readable, writable, type Readable } from 'svelte/store';
import { awaitAppInitialization } from './user.store';
import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { nestedDerived, useInteractionObserver, waitFor } from '$lib/utils';
import { tick } from 'svelte';

/** @deprecated */
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

/**
 * Useful for infinite scroll. By default, loads the initial page automatically.
 * @deprecated
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
	// const { hasFocus: isActive } = getStackRouterPage();
	const { root } = useComponentStack();
	const isActive = nestedDerived(root, ($root) => $root?.hasFocusWithin ?? readable(false));
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

export function useStaleable(refetch: () => Promise<unknown>) {
	const componentStack = useComponentStack();

	type RefetchPromise = ReturnType<typeof refetch> | undefined;
	let unsubToStaleWatcher: (() => void) | undefined;
	const resolves: ((v: RefetchPromise) => void)[] = [];
	/**
	 * Waits for the component to come to front and then refetches the data.
	 *
	 * @returns a promise that resolves when the data is set to stale and refetching starts, or undefined if the component is unmounted before that
	 * */
	function setStale(timeout = 1500) {
		const out = new Promise<RefetchPromise>((resolve) => {
			let t: ReturnType<typeof setTimeout>;

			const f = (v: RefetchPromise) => {
				clearTimeout(t);
				resolve(v);
			};

			resolves.push(f);

			t = setTimeout(() => {
				resolves.splice(resolves.indexOf(f), 1).forEach((r) => r(undefined));
			}, timeout);
		});

		console.log('setStale called, waiting for component to come to front...', componentStack);

		// Hack because hasFocusWithin is still true when new page mounts
		tick().then(() => {
			unsubToStaleWatcher?.();
			unsubToStaleWatcher = waitFor(
				componentStack.hasFocusWithin,
				(isFocused) => !!isFocused,
				() => {
					console.log('Component focused, refetching data...', componentStack);
					const p = refetch();
					// const p = fetchData();
					// isLoading.set(true);
					resolves.splice(0).forEach((r) => r(p));
				}
			).unsubscribe;
		});

		return out;
	}

	return {
		setStale,
		unsubscribe: () => {
			unsubToStaleWatcher?.();
			resolves.splice(0).forEach((r) => r(undefined));
		}
	};
}

/**
 * Utility hook for making consistent atomic updates from promise callbacks
 */
export function useAtomicUpdates() {
	let version = 0;
	let chain: Promise<unknown> = Promise.resolve();

	/** Invalidates all previous pending update callbacks */
	function atomicThen<T>(fn: Promise<T>, cb: (v: T) => void) {
		const v = ++version;
		chain = fn.catch(() => {});

		fn.then((val) => {
			if (version === v) {
				cb(val);
			}
		});
	}

	/** Waits for all previous updates to complete before callback */
	function sequentialThen<T>(fn: Promise<T>, cb: (v: T) => void) {
		const v = version;
		chain = chain
			.then(() => fn)
			.then((val) => {
				if (version === v) {
					cb(val);
				}
			})
			.catch(() => {});
	}

	return {
		atomicThen,
		sequentialThen,
		invalidate: () => {
			version += 1;
		}
	};
}

/**
 * A store for fetching data with the ability to make it stale and refetch automatically when the component page comes to front
 *
 * If prev is used, the return type must be explicitly defined
 */
export function _useData<TResponse>(fetchData: () => Promise<TResponse>) {
	const atomicUpdates = useAtomicUpdates();

	const lastData = writable<TResponse | undefined>(undefined);
	const isLoading = writable(true);
	const promise = writable(makeRequest(false));

	async function makeRequest(setPromise = true) {
		return new Promise<TResponse>((resolve) => {
			isLoading.set(true);

			const p = awaitAppInitialization().then(() => fetchData());
			if (setPromise) promise.set(p);

			atomicUpdates.atomicThen(p, (data) => {
				lastData.set(data);
				isLoading.set(false);
				resolve(data);
			});
		});
	}

	return {
		data: lastData,
		isLoading,
		promise,
		update: () => makeRequest()
	};
}

export function usePaginatedRequest2<T>(fn: (page: number) => Promise<T[]>) {
	let p = 1;
	let stop = false;
	const data = writable([] as T[]);
	const loading = writable(false);
	const atomicUpdates = useAtomicUpdates();

	function fetchPage() {
		if (stop) return;
		const page = p;
		p++;
		loading.set(true);

		atomicUpdates.sequentialThen(fn(page), (newItems) => {
			console.log('atomic update', { page, newItems });
			data.update((d) => {
				d.push(...newItems);
				return d;
			});
			loading.set(false);
			if (newItems.length === 0) {
				stop = true;
			}
		});
	}

	function reset() {
		p = 1;
		stop = false;
		data.set([] as T[]);
		loading.set(false);
		atomicUpdates.invalidate();
		console.log('Data reset, version invalidated');
	}

	const observer = useInteractionObserver(() => fetchPage());

	return {
		subscribe: data.subscribe,
		loading,
		fetchPage,
		observer,
		reset
	};
}
