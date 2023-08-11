import { writable } from 'svelte/store';

function createLocalStorageStore(key: string) {
	const store = writable(JSON.parse(localStorage.getItem(key) || 'null') || null);

	return {
		subscribe: store.subscribe,
		set: (value: any) => {
			localStorage.setItem(key, JSON.stringify(value));
			store.set(value);
		}
	};
}

export const skippedVersion = createLocalStorageStore('skipped-version');
