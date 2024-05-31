import { get, writable } from 'svelte/store';
import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
import { createErrorNotification } from '$lib/stores/notification.store';
import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
import { getJellyfinHealth, getJellyfinUsers } from '$lib/apis/jellyfin/jellyfinApi';
import axios from 'axios';

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
		apiKey: null,
		baseUrl: null,
		userId: null
	}
};

function useSettings() {
	const settings = writable<SettingsValues>(defaultSettings);

	async function save() {
		const values = get(settings);
		if (
			values.sonarr.apiKey &&
			values.sonarr.baseUrl &&
			!(await getSonarrHealth(values.sonarr.baseUrl, values.sonarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Sonarr. Check Sonarr credentials.'
			);
			return;
		}

		if (
			values.radarr.apiKey &&
			values.radarr.baseUrl &&
			!(await getRadarrHealth(values.radarr.baseUrl, values.radarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Radarr. Check Radarr credentials.'
			);
			return;
		}

		if (values.jellyfin.apiKey && values.jellyfin.baseUrl) {
			if (!(await getJellyfinHealth(values.jellyfin.baseUrl, values.jellyfin.apiKey))) {
				createErrorNotification(
					'Invalid Configuration',
					'Could not connect to Jellyfin. Check Jellyfin credentials.'
				);
				return;
			}
			const users = await getJellyfinUsers(values.jellyfin.baseUrl, values.jellyfin.apiKey);
			if (!users.find((u) => u.Id === values.jellyfin.userId)) values.jellyfin.userId = null;
		}

		return axios.post('/api/settings', values).then(() => {
			settings.set(values);
		});
	}

	return {
		subscribe: settings.subscribe,
		set: settings.set,
		save
	};
}

export const settings = useSettings();
