import { writable } from 'svelte/store';

export function createLocalStorageStore<T>(key: string) {
	const store = writable<T | null>(JSON.parse(localStorage.getItem(key) || 'null') || null);

	return {
		subscribe: store.subscribe,
		set: (value: T | null) => {
			localStorage.setItem(key, JSON.stringify(value));
			store.set(value);
		}
	};
}

export const skippedVersion = createLocalStorageStore('skipped-version');
