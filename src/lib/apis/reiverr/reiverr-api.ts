import createClient from 'openapi-fetch';
import type { components, paths } from './reiverr.generated';
import { get } from 'svelte/store';
import type { Api } from '../api.interface';
import { sessions } from '../../stores/session.store';

export type ReiverrUser = components['schemas']['UserDto'];
export type CreateReiverrUser = components['schemas']['CreateUserDto'];
export type UpdateReiverrUser = components['schemas']['UpdateUserDto'];
export type ReiverrSettings = ReiverrUser['settings'];

export type PlayStateDto = components['schemas']['PlayStateDto'];
export type UpdatePlayStateDto = components['schemas']['UpdatePlayStateDto'];

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

	getMyList = () =>
		this.getClient()
			?.GET('/my-list')
			.then((r) => r.data || []) || Promise.resolve([]);

	addToMyList = (tmdbId: number) =>
		this.getClient()
			?.POST('/my-list/{tmdbId}', { params: { path: { tmdbId } } })
			.then((r) => r.data || []) || Promise.resolve([]);

	removeFromMyList = (tmdbId: number) =>
		this.getClient()
			?.DELETE('/my-list/{tmdbId}', { params: { path: { tmdbId } } })
			.then((r) => r.data || []) || Promise.resolve([]);

	getPlayState = (tmdbId: number, seasonNumber?: number, episodeNumber?: number) => {
		if (seasonNumber !== undefined && episodeNumber !== undefined) {
			return this.getClient()
				?.GET('/play-state/{tmdbId}/season/{seasonNumber}/episode/{episodeNumber}', {
					params: {
						path: {
							tmdbId,
							seasonNumber,
							episodeNumber
						}
					}
				})
				.then((r) => r.data);
		} else {
			return this.getClient()
				?.GET('/play-state/{tmdbId}', { params: { path: { tmdbId } } })
				.then((r) => r.data);
		}
	};

	setPlayState = (
		tmdbId: number,
		seasonNumber: number | undefined,
		episodeNumber: number | undefined,
		playState: UpdatePlayStateDto
	) => {
		if (seasonNumber !== undefined && episodeNumber !== undefined) {
			return this.getClient()
				?.PUT('/play-state/{tmdbId}/season/{seasonNumber}/episode/{episodeNumber}', {
					body: playState,
					params: {
						path: { tmdbId, seasonNumber, episodeNumber }
					}
				})
				.then((r) => r.data);
		} else {
			return this.getClient()
				?.PUT('/play-state/{tmdbId}', {
					body: playState,
					params: { path: { tmdbId } }
				})
				.then((r) => r.data);
		}
	};
}

export const reiverrApi = new ReiverrApi();
export const getReiverrApiClient = reiverrApi.getClient;
