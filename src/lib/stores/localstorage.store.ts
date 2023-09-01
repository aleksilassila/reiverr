import { writable } from 'svelte/store';

export function createLocalStorageStore<T>(key: string, defaultValue: T) {
	const store = writable<T>(JSON.parse(localStorage.getItem(key) || 'null') || defaultValue);

	return {
		subscribe: store.subscribe,
		set: (value: T) => {
			localStorage.setItem(key, JSON.stringify(value));
			store.set(value);
		}
	};
}

export const skippedVersion = createLocalStorageStore<string | null>('skipped-version', null);
