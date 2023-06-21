import createClient from 'openapi-fetch';
import type { paths } from '$lib/sonarr/sonarr-types';
import { SONARR_API_KEY, SONARR_BASE_URL } from '$env/static/private';

export const SonarrApi = createClient<paths>({
	baseUrl: SONARR_BASE_URL,
	headers: {
		'X-Api-Key': SONARR_API_KEY
	}
});
