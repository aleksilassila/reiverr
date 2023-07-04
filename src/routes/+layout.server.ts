import type { LayoutServerLoad } from './$types';
import {
	RADARR_API_KEY,
	RADARR_BASE_URL,
	SONARR_API_KEY,
	SONARR_BASE_URL
} from '$env/static/private';
import { PUBLIC_JELLYFIN_API_KEY, PUBLIC_JELLYFIN_URL } from '$env/static/public';

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
