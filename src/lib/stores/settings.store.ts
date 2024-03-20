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
	sonarr: {
		baseUrl: string | null;
		apiKey: string | null;
		rootFolderPath: string;
		qualityProfileId: number;
		languageProfileId: number;
	};
	radarr: {
		baseUrl: string | null;
		apiKey: string | null;
		rootFolderPath: string;
		qualityProfileId: number;
	};
	jellyfin: {
		baseUrl: string | null;
		apiKey: string | null;
		userId: string | null;
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
	},
	sonarr: {
		apiKey: null,
		baseUrl: null,
		qualityProfileId: 0,
		rootFolderPath: '',
		languageProfileId: 0
	},
	radarr: {
		apiKey: null,
		baseUrl: null,
		qualityProfileId: 0,
		rootFolderPath: ''
	},
	jellyfin: {
		apiKey: 'ff526980723144a095f560fc2975657b',
		baseUrl: 'http://192.168.0.129:8096',
		userId: '75dcb061c9404115a7acdc893ea6bbbc'
	}
};

export const settings = writable<SettingsValues>(defaultSettings);
