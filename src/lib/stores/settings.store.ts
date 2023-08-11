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
	sonarr: {
		qualityProfileId: number;
		rootFolderPath: string;
		languageProfileId: number;
	};
	radarr: {
		qualityProfileId: number;
		profileId: number;
		rootFolderPath: string;
	};
	jellyfin: {
		userId: string;
	};
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
	animationDuration: 150,
	sonarr: {
		qualityProfileId: 4,
		rootFolderPath: '/tv',
		languageProfileId: 1
	},
	radarr: {
		qualityProfileId: 4,
		profileId: 4,
		rootFolderPath: '/movies'
	}
};

export const settings = writable<Settings>(defaultSettings);

export const getIncludedLanguagesQuery = () => {
	const settingsValue = get(settings);
	if (settingsValue.discover.filterBasedOnLanguage) {
		return { with_original_language: settingsValue.language };
	}

	return {};
};
