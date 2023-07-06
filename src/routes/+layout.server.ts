import type { LayoutServerLoad } from './$types';
import {
	RADARR_API_KEY,
	RADARR_BASE_URL,
	SONARR_API_KEY,
	SONARR_BASE_URL
} from '$env/static/private';
import { PUBLIC_JELLYFIN_API_KEY, PUBLIC_JELLYFIN_URL } from '$env/static/public';

export type MissingEnvironmentVariables = {
	RADARR_API_KEY: boolean;
	RADARR_BASE_URL: boolean;
	SONARR_API_KEY: boolean;
	SONARR_BASE_URL: boolean;
	PUBLIC_JELLYFIN_API_KEY: boolean;
	PUBLIC_JELLYFIN_URL: boolean;
};

export const load = (async () => {
	const isApplicationSetUp =
		!!RADARR_API_KEY &&
		!!RADARR_BASE_URL &&
		!!SONARR_API_KEY &&
		!!SONARR_BASE_URL &&
		!!PUBLIC_JELLYFIN_API_KEY &&
		!!PUBLIC_JELLYFIN_URL;

	return {
		isApplicationSetUp,
		missingEnvironmentVariables: {
			RADARR_API_KEY: !RADARR_API_KEY,
			RADARR_BASE_URL: !RADARR_BASE_URL,
			SONARR_API_KEY: !SONARR_API_KEY,
			SONARR_BASE_URL: !SONARR_BASE_URL,
			PUBLIC_JELLYFIN_API_KEY: !PUBLIC_JELLYFIN_API_KEY,
			PUBLIC_JELLYFIN_URL: !PUBLIC_JELLYFIN_URL
		}
	};
}) satisfies LayoutServerLoad;
