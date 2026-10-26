import { getUserId, reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { pagedQueryOptions } from './query-client';

const TITLES_PAGE_SIZE = 50;

type TitlesParams = Omit<
	NonNullable<Parameters<typeof reiverrApi.library.getUserTitles>[1]>,
	'page' | 'itemsPerPage'
>;

export const storageKeys = {
	/** Everything of the usage of the user: what a change of their requests invalidates */
	all: ['storage'] as const,
	/** What the requests of the user hold and wait for, against their quota */
	user: () => ['storage', 'user'] as const,
	titles: (params: TitlesParams) => ['storage', 'titles', params] as const
};

export const storageQueries = {
	user: () =>
		queryOptions({
			queryKey: storageKeys.user(),
			queryFn: () => reiverrApi.library.getUserStorage(getUserId()).then((r) => r.data)
		}),
	/** The titles the user has requests for, with what they take */
	titles: (params: TitlesParams) =>
		pagedQueryOptions({
			queryKey: storageKeys.titles(params),
			queryFn: (page) =>
				reiverrApi.library
					.getUserTitles(getUserId(), { ...params, page, itemsPerPage: TITLES_PAGE_SIZE })
					.then((r) => r.data.items)
		})
};
