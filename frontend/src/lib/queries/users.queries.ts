import type { CreateUserDto, UpdateUserDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi, user } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { get } from 'svelte/store';
import { invalidate } from './query-client';
import { storageKeys } from './storage.queries';

export const usersKeys = {
	list: () => ['users'] as const
};

export const usersQueries = {
	/** Every account of the server */
	list: () =>
		queryOptions({
			queryKey: usersKeys.list(),
			queryFn: () => reiverrApi.users.getUsers().then((r) => r.data)
		})
};

export async function createUser(dto: CreateUserDto) {
	await reiverrApi.users.createUser(dto);
	await invalidate(usersKeys.list());
}

/** The user of the session is updated through the user store, which the app reads them from */
export async function updateUser(id: string, update: UpdateUserDto) {
	if (id === get(user)?.id) {
		const error = await user.updateUser((current) => ({ ...current, ...update }));
		if (error) throw error;
	} else {
		await reiverrApi.users.updateUser(id, update);
	}
	// The quota is in the usage of the user
	await invalidate(usersKeys.list(), storageKeys.all);
}

export async function deleteUser(id: string) {
	await reiverrApi.users.deleteUser(id);
	await invalidate(usersKeys.list());
}
