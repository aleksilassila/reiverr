import type { LayoutServerLoad } from './$types';
import {
	PUBLIC_RADARR_API_KEY,
	PUBLIC_RADARR_BASE_URL,
	PUBLIC_SONARR_API_KEY,
	PUBLIC_SONARR_BASE_URL
} from '$env/static/public';
import { PUBLIC_JELLYFIN_API_KEY, PUBLIC_JELLYFIN_URL } from '$env/static/public';

export type MissingEnvironmentVariables = {
	PUBLIC_RADARR_API_KEY: boolean;
	PUBLIC_RADARR_BASE_URL: boolean;
	PUBLIC_SONARR_API_KEY: boolean;
	PUBLIC_SONARR_BASE_URL: boolean;
	PUBLIC_JELLYFIN_API_KEY: boolean;
	PUBLIC_JELLYFIN_URL: boolean;
};

export const load = (async () => {
	const isApplicationSetUp =
		!!PUBLIC_RADARR_API_KEY &&
		!!PUBLIC_RADARR_BASE_URL &&
		!!PUBLIC_SONARR_API_KEY &&
		!!PUBLIC_SONARR_BASE_URL &&
		!!PUBLIC_JELLYFIN_API_KEY &&
		!!PUBLIC_JELLYFIN_URL;

	return {
		isApplicationSetUp,
		missingEnvironmentVariables: {
			PUBLIC_RADARR_API_KEY: !PUBLIC_RADARR_API_KEY,
			PUBLIC_RADARR_BASE_URL: !PUBLIC_RADARR_BASE_URL,
			PUBLIC_SONARR_API_KEY: !PUBLIC_SONARR_API_KEY,
			PUBLIC_SONARR_BASE_URL: !PUBLIC_SONARR_BASE_URL,
			PUBLIC_JELLYFIN_API_KEY: !PUBLIC_JELLYFIN_API_KEY,
			PUBLIC_JELLYFIN_URL: !PUBLIC_JELLYFIN_URL
		}
	};
}) satisfies LayoutServerLoad;
