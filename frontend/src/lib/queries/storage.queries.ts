import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';

export const storageKeys = {
	/** Everything of the usage of the user: what a change of their requests invalidates */
	all: ['storage'] as const,
	/** What the requests of the user hold and wait for, against their quota */
	user: () => [...storageKeys.all, 'user'] as const
};

export const storageQueries = {
	user: () =>
		queryOptions({
			queryKey: storageKeys.user(),
			queryFn: () => reiverrApi.library.getUserStorage().then((r) => r.data)
		})
};
