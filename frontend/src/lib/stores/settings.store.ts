import { writable } from 'svelte/store';

export interface SettingsValues {
	initialised: boolean;
	autoplayTrailers: boolean;
	language: string;
	animationDuration: number;
	discover: {
		region: string;
		excludeLibraryItems: boolean;
		includedLanguages: string;
	};
}

export const defaultSettings: SettingsValues = {
	initialised: false,

	autoplayTrailers: true,
	language: 'en',
	animationDuration: 150,
	discover: {
		region: '',
		excludeLibraryItems: true,
		includedLanguages: 'en'
	}
};

export const settings = writable<SettingsValues>(defaultSettings);
