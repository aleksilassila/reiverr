import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';
import { PUBLIC_SONARR_API_KEY, PUBLIC_SONARR_BASE_URL } from '$env/static/public';

export const SonarrApi = createClient<paths>({
	baseUrl: PUBLIC_SONARR_BASE_URL,
	headers: {
		'X-Api-Key': PUBLIC_SONARR_API_KEY
	}
});
