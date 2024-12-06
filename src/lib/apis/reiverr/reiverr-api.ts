import createClient from 'openapi-fetch';
import type { components, paths } from './reiverr.generated';
import { get } from 'svelte/store';
import type { Api } from '../api.interface';
import { sessions } from '../../stores/session.store';
import {
	Api as ReiverrApiNew,
	type CreateUserDto,
	type Settings,
	type UpdateUserDto,
	type UserDto
} from './reiverr.openapi';

export type ReiverrUser = UserDto;
export type CreateReiverrUser = CreateUserDto;
export type UpdateReiverrUser = UpdateUserDto;
export type ReiverrSettings = Settings;

export const getReiverrApiNew = () => {
	const session = get(sessions).activeSession;
	const token = session?.token;
	console.log('session', session);
	console.log('Creating Reiverr API with base URL:', session?.baseUrl, 'and token:', token);

	return new ReiverrApiNew({
		baseURL: session?.baseUrl,
		headers: {
			Authorization: token ? `Bearer ${token}` : ''
		}
	});
};

export class ReiverrApi implements Api<paths> {
	getClient(basePath?: string, _token?: string) {
		const session = get(sessions).activeSession;
		const token = _token || session?.token;

		return createClient<paths>({
			baseUrl: (basePath || session?.baseUrl) + '/api',
			...(token && {
				headers: {
					Authorization: 'Bearer ' + token
				}
			})
		});
	}

	updateUser = (id: string, user: UpdateReiverrUser) =>
		this.getClient()
			?.PUT('/users/{id}', {
				params: {
					path: {
						id
					}
				},
				body: user
			})
			.then((res) => ({ user: res.data, error: res.error?.message }));

	getUsers = () =>
		this.getClient()
			.GET('/users', {})
			.then((res) => res.data);

	deleteUser = (id?: string) =>
		this.getClient()
			?.DELETE('/users/{id}', {
				params: {
					path: {
						id: id || get(sessions).activeSession?.id || ''
					}
				}
			})
			.then((res) => res.error?.message);

	createUser = (user: CreateReiverrUser) =>
		this.getClient()
			?.POST('/users', {
				body: user
			})
			.then((res) => ({ user: res.data, error: res.error?.message }));
}

export const reiverrApi = new ReiverrApi();
export const getReiverrApiClient = reiverrApi.getClient;
