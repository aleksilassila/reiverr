import createClient from 'openapi-fetch';
import type { paths as sonarrPaths } from '$lib/sonarr/sonarr';
import { PUBLIC_SONARR_API_KEY } from '$env/static/public';

export const SonarrApi = createClient<sonarrPaths>({
	baseUrl: 'http://sonarr.home',
	headers: {
		'X-Api-Key': PUBLIC_SONARR_API_KEY
	}
});
