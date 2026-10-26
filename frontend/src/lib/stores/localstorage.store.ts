import { get, writable } from 'svelte/store';

export function createLocalStorageStore<T>(key: string, defaultValue: T) {
	const store = writable<T>(JSON.parse(localStorage.getItem(key) || 'null') || defaultValue);

	function writeValue(value: T) {
		const strigified = JSON.stringify(value);
		if (strigified === JSON.stringify(defaultValue)) {
			localStorage.removeItem(key);
		} else {
			localStorage.setItem(key, strigified);
		}
	}

	return {
		subscribe: store.subscribe,
		get: () => get(store),
		set: (value: T) => {
			writeValue(value);
			store.set(value);
		},
		update: (updater: (value: T) => T) => {
			const newValue = updater(get(store));
			writeValue(newValue);
			store.set(newValue);
		},
		remove: () => {
			localStorage.removeItem(key);
			store.set(defaultValue);
		}
	};
}

export const skippedVersion = createLocalStorageStore<string>('skipped-version', '');
export const videoPlayerSettings = createLocalStorageStore<{
	muted: boolean;
	volume: number;
}>('video-player-settings', {
	muted: false,
	volume: 1
});
export const localSettings = createLocalStorageStore<{
	animateScrolling: boolean;
	useCssTransitions: boolean;
	checkForUpdates: boolean;
	skippedVersion: string;
	enableTrailers: boolean;
	autoplayTrailers: boolean;
}>('settings', {
	animateScrolling: true,
	useCssTransitions: true,
	checkForUpdates: true,
	skippedVersion: '',
	enableTrailers: true,
	autoplayTrailers: true
});
