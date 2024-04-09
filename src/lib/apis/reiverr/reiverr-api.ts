import createClient from 'openapi-fetch';
import type { components, paths } from './reiverr.generated';
import { get } from 'svelte/store';
import { appState } from '../../stores/app-state.store';
import type { Api } from '../api.interface';

export type ReiverrUser = components['schemas']['UserDto'];

export class ReiverrApi implements Api<paths> {
	getClient(basePath?: string, _token?: string) {
		const token = _token || get(appState).token;

		return createClient<paths>({
			baseUrl: (basePath || get(appState).serverBaseUrl) + '/api',
			...(token && {
				headers: {
					Authorization: 'Bearer ' + token
				}
			})
		});
	}

	async getUser() {
		const res = await this.getClient()?.GET('/user', {});
		return res.data;
	}

	authenticate(name: string, password: string) {
		return this.getClient().POST('/auth', {
			body: {
				name,
				password
			}
		});
	}
}

export const reiverrApi = new ReiverrApi();
export const getReiverrApiClient = reiverrApi.getClient;
