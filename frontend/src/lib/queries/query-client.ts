import { infiniteQueryOptions, QueryClient, type QueryKey } from '@tanstack/svelte-query';

const MINUTE = 60_000;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Errors are shown at once, as everywhere else in the app
			retry: false,
			// The server is on the local network, so the browser's online flag says nothing about it
			networkMode: 'always',
			// What a page showed is good for a while when it comes back to the front; what changes
			// through the app is invalidated by the mutation that changed it
			staleTime: MINUTE
		},
		mutations: { networkMode: 'always' }
	}
});

/**
 * Marks the queries under the keys stale and refetches those a page at the front shows.
 * Resolves once they are refetched, so that a button stays busy until the page shows the change.
 */
export function invalidate(...keys: QueryKey[]) {
	return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

/**
 * A list fetched a page at a time, by page number from 1, until a page comes back empty.
 * Its data is the items of the pages fetched so far.
 */
export function pagedQueryOptions<TItem, TQueryKey extends QueryKey>(options: {
	queryKey: TQueryKey;
	queryFn: (page: number) => Promise<TItem[]>;
}) {
	return infiniteQueryOptions({
		queryKey: options.queryKey,
		queryFn: ({ pageParam }) => options.queryFn(pageParam),
		initialPageParam: 1,
		getNextPageParam: (lastPage, _pages, lastPageParam) =>
			lastPage.length ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flat()
	});
}
