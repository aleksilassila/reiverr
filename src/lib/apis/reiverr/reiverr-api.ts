import createClient from 'openapi-fetch';
import type { paths } from './reiverr.generated';
import { get } from 'svelte/store';
import { appState } from '../../stores/app-state.store';
import type { Api } from '../api.interface';

export class ReiverrApi implements Api<paths> {
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
