import { get, writable } from 'svelte/store';

export function createLocalStorageStore<T>(key: string, defaultValue: T) {
	const store = writable<T>(JSON.parse(localStorage.getItem(key) || 'null') || defaultValue);

	return {
		subscribe: store.subscribe,
		get: () => get(store),
		set: (value: T) => {
			localStorage.setItem(key, JSON.stringify(value));
			store.set(value);
			console.log(`Set ${key} to`, value); // Debugging line
		},
		update: (updater: (value: T) => T) => {
			const newValue = updater(get(store));
			localStorage.setItem(key, JSON.stringify(newValue));
			store.set(newValue);
			console.log(`Updated ${key} to`, newValue); // Debugging line
		},
		remove: () => {
			localStorage.removeItem(key);
			store.set(defaultValue);
			console.log(`Removed ${key}`); // Debugging line
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
	language: string; // Propriété language ajoutée ici
}>('settings', {
	animateScrolling: true,
	useCssTransitions: true,
	checkForUpdates: true,
	skippedVersion: '',
	language: 'en' // Valeur par défaut pour la langue
});
