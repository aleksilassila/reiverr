import { getContext, hasContext, setContext } from 'svelte';
import { get, type Readable, writable } from 'svelte/store';

export function formatSecondsToTime(seconds: number) {
	const days = Math.floor(seconds / 60 / 60 / 24);
	const hours = Math.floor((seconds / 60 / 60) % 24);
	const minutes = Math.floor((seconds / 60) % 60);
	const secondsLeft = Math.floor(seconds % 60);

	return `${days > 0 ? days + ':' : ''}${hours > 0 ? hours + ':' : ''}${
		days > 0 || hours > 0 ? minutes.toString().padStart(2, '0') : minutes
	}:${secondsLeft.toString().padStart(2, '0')}`;
}

export function formatMinutesToTime(minutes: number) {
	const days = Math.floor(minutes / 60 / 24);
	const hours = Math.floor((minutes / 60) % 24);
	const minutesLeft = Math.floor(minutes % 60);

	return `${days > 0 ? days + 'd ' : ''}${hours > 0 ? hours + 'h ' : ''}${
		days > 0 ? '' : minutesLeft + 'min'
	}`;
}

export function formatSize(size: number) {
	const gbs = size / 1024 / 1024 / 1024;
	const mbs = size / 1024 / 1024;

	if (gbs >= 1) {
		return `${gbs.toFixed(2)} GB`;
	} else {
		return `${mbs.toFixed(2)} MB`;
	}
}

export function formatThousands(num: number) {
	if (num > 999) return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	else return num;
}

export function request<R, A>(fetcher: (arg: A) => Promise<R>, args: A | undefined = undefined) {
	const loading = writable(args !== undefined);
	const error = writable<Error | null>(null);
	const data = writable<R | null>(null);
	const didLoad = writable(false);

	async function load(arg: A) {
		loading.set(true);
		error.set(null);

		fetcher(arg)
			.then((d) => {
				// if (typeof window !== undefined) console.log('request data', d);
				data.set(d);
			})
			.catch((e) => error.set(e))
			.finally(() => {
				loading.set(false);
				didLoad.set(true);
			});
	}

	if (args !== undefined) {
		load(args);
	}

	return {
		loading,
		error,
		data,
		didLoad,
		load
	};
}

export const getFadeIndex = () => {
	const obj: any = {
		index: -1
	};

	function getNext() {
		return ++obj.index;
	}

	obj.getNextFadeIndex = getNext;

	return obj;
};

export function log<T>(arg: T): T {
	console.log('LOGGER', arg);
	return arg;
}

export function timeout<T>(ms: number, ret?: T) {
	return new Promise<T | void>((resolve) => setTimeout(() => resolve(ret), ms));
}

export function retry<T>(
	fn: () => Promise<T>,
	successFn: (v: T) => boolean = (v) => !!v,
	options: { retries?: number; delay?: number; reject?: boolean } = {}
) {
	let { retries = 3, delay = 1000, reject = false } = options;
	return new Promise<T>((resolve, _reject) => {
		function attempt() {
			fn().then((v) => {
				if (successFn(v)) {
					resolve(v);
				} else {
					if (retries > 0) {
						retries--;
						setTimeout(attempt, delay);
					} else if (reject) {
						_reject(new Error('Max retries reached'));
					} else {
						resolve(v);
					}
				}
			});
		}

		attempt();
	});
}

export function formatDateToYearMonthDay(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

export function capitalize(str: string) {
	const strings = str.split(' ');
	return strings.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

export function subscribeUntil<T>(store: Readable<T>, fn: (value: T) => boolean) {
	const unsubscribe = store.subscribe((v) => {
		if (fn(v)) {
			unsubscribe();
		}
	});
}

export function getVideoZoomLevel(options: {
	viewportWidth: number;
	viewportHeight: number;
	aspectRatio?: number;
}) {
	const { viewportWidth, viewportHeight, aspectRatio = 16 / 9 } = options;

	const videoWidth = viewportWidth;
	const videoHeight = videoWidth / aspectRatio;

	return viewportHeight / videoHeight;
}

export function getCardDimensions(options: {
	viewportWidth: number;
	orientation?: 'portrait' | 'landscape';
	size?: 'sm' | 'md' | 'lg';
}) {
	const { viewportWidth, orientation = 'portrait', size = 'lg' } = options;

	const minWidth =
		orientation === 'portrait'
			? {
					sm: 160,
					md: 200,
					lg: 240
				}[size]
			: {
					sm: 300,
					md: 350,
					lg: 400
				}[size];

	const margin = 128;
	const gap = 32;

	const cols = Math.max(1, Math.floor((gap - 2 * margin + viewportWidth) / (minWidth + gap)));
	const scale = -(gap * (cols - 1) + 2 * margin - viewportWidth) / (cols * minWidth);

	const newWidth = minWidth * scale;
	const newHeight = (orientation === 'portrait' ? 3 / 2 : 9 / 16) * newWidth;

	return {
		width: Math.round(newWidth),
		height: Math.round(newHeight),
		columns: cols
	};
}

export function useTimeoutStore(duration: number, initialReset = false) {
	const store = writable(true);

	let timeout: ReturnType<typeof setTimeout> | undefined;

	function reset() {
		if (!get(store)) store.set(true);
		clearTimeout(timeout);

		timeout = setTimeout(() => {
			store.set(false);
		}, duration);
	}

	if (initialReset) {
		reset();
	}

	return {
		subscribe: store.subscribe,
		reset
	};
}

export const hook = <TArgs extends Array<unknown>, TReturn>(
	fn: (...args: TArgs) => TReturn,
	options: {
		after?: (v: TReturn) => TReturn;
		before?: (v: TArgs) => TArgs;
	} = {}
) => {
	const hooks: Array<(arg: any) => any> = [];

	const wrappedFn = (...args: TArgs) => {
		const a = options.before ? options.before(args) : args;

		const result = fn(...a);

		if (options.after) {
			return options.after(result);
		}

		return result;
	};

	return wrappedFn;
};

export function createStoreContext<
	TStore extends object,
	TArgs extends Array<unknown> = Array<unknown>,
	TRequired extends boolean = boolean
>(
	key: string,
	storeCreator: (...args: TArgs) => TStore,
	options: {
		required?: TRequired;
	} = {}
) {
	function createContext(...args: TArgs) {
		const store = storeCreator(...args);
		setContext(key, store);
		return store;
	}

	function _getContext(): TRequired extends true ? TStore : Partial<TStore>;
	function _getContext(): Partial<TStore> | TStore {
		if (!hasContext(key)) {
			if (options.required === true) {
				throw new Error(`Context ${key} not found`);
			} else {
				return {};
			}
		}

		return getContext(key);
	}

	return {
		createContext,
		getContext: _getContext,
		useStore: storeCreator
	};
}

export function toNonNullable<T>(value: T | null | undefined): NonNullable<T> {
	if (value == null) {
		throw new Error('Value is null or undefined');
	}
	return value;
}
