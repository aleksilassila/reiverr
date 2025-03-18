import { get } from 'svelte/store';
import { sessions } from '../../stores/session.store';
import {
	Api as ReiverrApi,
	type CreateUserDto,
	type Settings,
	type UpdateUserDto,
	type UserDto
} from './reiverr.openapi';

export type ReiverrUser = UserDto;
export type CreateReiverrUser = CreateUserDto;
export type UpdateReiverrUser = UpdateUserDto;
export type ReiverrSettings = Settings;

export const getReiverrApi = (session = get(sessions).activeSession) => {
	const token = session?.token;
	console.log('session', session);
	console.log('Creating Reiverr API with base URL:', session?.baseUrl, 'and token:', token);

	return new ReiverrApi({
		baseURL: session?.baseUrl,
		headers: {
			Authorization: token ? `Bearer ${token}` : ''
		}
	});
};

export const getPublicReiverrApi = (baseUrl: string) =>  new ReiverrApi({ baseURL: baseUrl });
