import {
	JELLYFIN_API_KEY,
	JELLYFIN_BASE_URL,
	RADARR_API_KEY,
	RADARR_BASE_URL,
	SONARR_API_KEY,
	SONARR_BASE_URL
} from '$lib/constants';
import { Settings } from '$lib/entities/Settings';
import type { LayoutServerLoad } from './$types';

export type MissingEnvironmentVariables = {
	PUBLIC_RADARR_API_KEY: boolean;
	PUBLIC_RADARR_BASE_URL: boolean;
	PUBLIC_SONARR_API_KEY: boolean;
	PUBLIC_SONARR_BASE_URL: boolean;
	PUBLIC_JELLYFIN_API_KEY: boolean;
	PUBLIC_JELLYFIN_URL: boolean;
};

export const load: LayoutServerLoad = async () => {
	const settings = await Settings.get();

	const isApplicationSetUp =
		!!RADARR_API_KEY &&
		!!RADARR_BASE_URL &&
		!!SONARR_API_KEY &&
		!!SONARR_BASE_URL &&
		!!JELLYFIN_API_KEY &&
		!!JELLYFIN_BASE_URL;

	return {
		settings: JSON.parse(JSON.stringify(settings)),
		isApplicationSetUp,
		missingEnvironmentVariables: {
			PUBLIC_RADARR_API_KEY: !RADARR_API_KEY,
			PUBLIC_RADARR_BASE_URL: !RADARR_BASE_URL,
			PUBLIC_SONARR_API_KEY: !SONARR_API_KEY,
			PUBLIC_SONARR_BASE_URL: !SONARR_BASE_URL,
			PUBLIC_JELLYFIN_API_KEY: !JELLYFIN_API_KEY,
			PUBLIC_JELLYFIN_URL: !JELLYFIN_BASE_URL
		}
	};
};
