import { get, writable } from 'svelte/store';

export interface SettingsValues {
	autoplayTrailers: boolean;
	excludeLibraryItemsFromDiscovery: boolean;
	language: string;
	region: string;
	animationDuration: number;
	discover: {
		includedLanguages: string[];
		filterBasedOnLanguage: boolean;
	};
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
	playback: {
		preferredPlaybackSource: 'reiverr' | 'jellyfin';
	};
}

export const defaultSettings: SettingsValues = {
	autoplayTrailers: true,
	excludeLibraryItemsFromDiscovery: true,
	language: 'en',
	region: 'US',
	animationDuration: 150,
	discover: {
		filterBasedOnLanguage: true,
		includedLanguages: ['en']
	},
	sonarr: {
		qualityProfileId: 4,
		rootFolderPath: '/tv',
		languageProfileId: 1
	},
	radarr: {
		qualityProfileId: 4,
		profileId: 4,
		rootFolderPath: '/movies'
	},
	jellyfin: {
		userId: ''
	},
	playback: {
		preferredPlaybackSource: 'reiverr'
	}
};

export const settings = writable<SettingsValues>();

export const getIncludedLanguagesQuery = () => {
	const settingsValue = get(settings);
	if (settingsValue.discover.filterBasedOnLanguage) {
		return { with_original_language: settingsValue.language };
	}

	return {};
};
