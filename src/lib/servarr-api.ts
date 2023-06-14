import createClient from 'openapi-fetch';
import type { paths as radarrPaths } from '$lib/radarr';
import type { paths as sonarrPaths } from '$lib/sonarr';
import { PUBLIC_RADARR_API_KEY, PUBLIC_SONARR_API_KEY } from '$env/static/public';

export const radarrApi = createClient<radarrPaths>({
	baseUrl: 'http://radarr.home',
	headers: {
		'X-Api-Key': PUBLIC_RADARR_API_KEY
	}
});

export const sonarrApi = createClient<sonarrPaths>({
	baseUrl: 'http://sonarr.home',
	headers: {
		'X-Api-Key': PUBLIC_SONARR_API_KEY
	}
});
