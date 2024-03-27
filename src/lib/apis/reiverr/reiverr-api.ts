import createClient from 'openapi-fetch';
import type { paths } from './reiverr.generated';
import { get } from 'svelte/store';
import { appState } from '../../stores/app-state.store';

interface ApiInterface<Paths extends NonNullable<unknown>> {
	getClient(): ReturnType<typeof createClient<Paths>>;
}
export class ReiverrApi implements ApiInterface<paths> {
	getClient(basePath?: string) {
		const token = get(appState).token;

		return createClient<paths>({
			baseUrl: (basePath || get(appState).serverBaseUrl) + '/api',
			...(token && {
				headers: {
					Authorization: 'Bearer ' + token
				}
			})
		});
	}
}

export const reiverrApi = new ReiverrApi();
export const getReiverrApiClient = reiverrApi.getClient;
