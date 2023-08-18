import { get, writable } from 'svelte/store';

export interface SettingsValues {
	initialised: boolean;
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
		baseUrl: string | null;
		apiKey: string | null;
		qualityProfileId: number;
		rootFolderPath: string;
		languageProfileId: number;
	};
	radarr: {
		baseUrl: string | null;
		apiKey: string | null;
		qualityProfileId: number;
		profileId: number;
		rootFolderPath: string;
	};
	jellyfin: {
		baseUrl: string | null;
		apiKey: string | null;
		userId: string | null;
	};
	playback: {
		preferredPlaybackSource: 'reiverr' | 'jellyfin';
	};
}

export const defaultSettings: SettingsValues = {
	initialised: false,
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
		apiKey: null,
		baseUrl: null,
		qualityProfileId: 4,
		rootFolderPath: '/tv',
		languageProfileId: 1
	},
	radarr: {
		apiKey: null,
		baseUrl: null,
		qualityProfileId: 4,
		profileId: 4,
		rootFolderPath: '/movies'
	},
	jellyfin: {
		apiKey: null,
		baseUrl: null,
		userId: null
	},
	playback: {
		preferredPlaybackSource: 'reiverr'
	}
};

export const settings = writable<SettingsValues>(defaultSettings);

export const getIncludedLanguagesQuery = () => {
	const settingsValue = get(settings);
	if (settingsValue?.discover.filterBasedOnLanguage) {
		return { with_original_language: settingsValue.language };
	}

	return {};
};
