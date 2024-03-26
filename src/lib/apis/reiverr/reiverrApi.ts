import createClient from 'openapi-fetch';
import type { paths } from './reiverr.generated';
import { Api } from '../api.interface';
import { authenticationToken } from '../../stores/localstorage.store';
import { get } from 'svelte/store';

class ReiverrApi<asd extends NonNullable<unknown>> extends Api<asd> {
	protected baseUrl: string;
	protected client: ReturnType<typeof createClient<paths>>;
	protected isLoggedIn = false;

	constructor(baseUrl: string) {
		super();
		this.baseUrl = baseUrl;

		const token = get(authenticationToken);

		this.client = createClient<paths>({
			baseUrl: this.baseUrl,
			...(token && {
				headers: {
					Authorization: 'Bearer ' + token
				}
			})
		});
	}
}

export const reiverrApi = new ReiverrApi<paths>('http://localhost:3000/api');
