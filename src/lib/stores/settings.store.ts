import { get, writable } from 'svelte/store';

interface Settings {
	autoplayTrailers: boolean;
	excludeLibraryItemsFromDiscovery: boolean;
	language: string;
	region: string;
	discover: {
		includedLanguages: string[];
		filterBasedOnLanguage: boolean;
	};
	animationDuration: number;
}

const defaultSettings: Settings = {
	autoplayTrailers: true,
	excludeLibraryItemsFromDiscovery: true,
	language: 'en',
	region: 'US',
	discover: {
		filterBasedOnLanguage: true,
		includedLanguages: ['en']
	},
	animationDuration: 150
};

export const settings = writable<Settings>(defaultSettings);

export const getIncludedLanguagesQuery = () => {
	const settingsValue = get(settings);
	if (settingsValue.discover.filterBasedOnLanguage) {
		return { with_original_language: settingsValue.language };
	}

	return {};
};
