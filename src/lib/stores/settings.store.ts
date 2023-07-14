import { writable } from 'svelte/store';

interface Settings {
	autoplayTrailers: boolean;
}

const defaultSettings: Settings = {
	autoplayTrailers: true
};

export const settings = writable<Settings>(defaultSettings);
