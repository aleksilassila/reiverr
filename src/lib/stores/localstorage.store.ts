import { get, writable } from 'svelte/store';

export function createLocalStorageStore<T>(key: string, defaultValue: T) {
	const store = writable<T>(JSON.parse(localStorage.getItem(key) || 'null') || defaultValue);

	return {
		subscribe: store.subscribe,
		set: (value: T) => {
			localStorage.setItem(key, JSON.stringify(value));
			store.set(value);
		},
		update: (updater: (value: T) => T) => {
			const newValue = updater(get(store));
			localStorage.setItem(key, JSON.stringify(newValue));
			store.set(newValue);
		},
		remove: () => {
			localStorage.removeItem(key);
			store.set(defaultValue);
		}
	};
}

export const skippedVersion = createLocalStorageStore<string | null>('skipped-version', null);
export const videoPlayerSettings = createLocalStorageStore<{
	muted: boolean;
	volume: number;
}>('video-player-settings', {
	muted: false,
	volume: 1
});
