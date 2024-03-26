import type createClient from 'openapi-fetch';

export abstract class Api<Paths extends NonNullable<unknown>> {
	protected abstract baseUrl: string;
	protected abstract client: ReturnType<typeof createClient<Paths>>;
	protected abstract isLoggedIn: boolean;

	getApi() {
		return this.client;
	}
}
