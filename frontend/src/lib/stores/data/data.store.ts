import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
import { useInteractionObserver, waitFor } from '$lib/utils';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import { awaitAppInitialization } from '../user.store';

/**
 * After setStale is called waits for the component to come to front and then refetches the data.
 * */
export function useStaleable(refetch: () => Promise<unknown>) {
	const componentStack = useComponentStack();

	type RefetchPromise = ReturnType<typeof refetch> | undefined;
	let unsubToStaleWatcher: (() => void) | undefined;
	const resolves: ((v: RefetchPromise) => void)[] = [];

	/** @returns a promise that resolves when the data is set to stale and refetching starts, or undefined if the component is unmounted before that */
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

/** Fetch data after app initialization in data stores */
export function useData<TResponse>(fetchData: () => Promise<TResponse>) {
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

export function usePaginatedData<T>(
	fn: (page: number) => Promise<T[]>,
	opts: { initialize?: boolean; fetchAfterReset?: boolean } = {}
) {
	const initialize = opts.initialize !== false; // default true
	const fetchAfterReset = opts.fetchAfterReset !== false; // default true

	let p = 1;
	let stop = false;
	const data = writable([] as T[]);
	const loading = writable(initialize);
	const atomicUpdates = useAtomicUpdates();

	function fetchPage() {
		if (stop) return;
		const page = p;
		p++;
		loading.set(true);

		atomicUpdates.sequentialThen(
			awaitAppInitialization().then(() => fn(page)),
			(newItems) => {
				data.update((d) => {
					d.push(...newItems);
					return d;
				});
				loading.set(false);
				if (newItems.length === 0) {
					stop = true;
				}
			}
		);
	}

	function reset() {
		p = 1;
		stop = false;
		data.set([] as T[]);
		loading.set(false);
		atomicUpdates.invalidate();
		if (fetchAfterReset) fetchPage();
	}

	const observer = useInteractionObserver(() => fetchPage());

	if (initialize) fetchPage();

	return {
		subscribe: data.subscribe,
		loading,
		fetchPage,
		observer,
		reset
	};
}
