import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { pagedQueryOptions } from './query-client';
import { LIVE_REFRESH_INTERVAL } from './request-status';

type MyListParams = Omit<
	NonNullable<Parameters<typeof reiverrApi.catalog.getMyList>[0]>,
	'page' | 'itemsPerPage'
>;
type DownloadsParams = NonNullable<Parameters<typeof reiverrApi.catalog.getDownloads>[0]>;
type OnDiskParams = Omit<
	NonNullable<Parameters<typeof reiverrApi.catalog.getOnDisk>[0]>,
	'page' | 'itemsPerPage'
>;

const ON_DISK_PAGE_SIZE = 50;

export type MyListOrder =
	'date-added' | 'name' | 'first-release-date' | 'last-release-date' | 'last-played';
export type CatalogOrderDirection = 'asc' | 'desc';
export type CatalogCategory = 'all' | 'series' | 'movies';
/** Whether what the user would watch next of a title is on disk */
export type MyListAvailability = 'available' | 'unavailable';

/** The media type a category of the pills asks the catalogue for */
export const mediaTypeOf = (category: CatalogCategory) =>
	category === 'all' ? undefined : category === 'movies' ? ('movie' as const) : ('series' as const);

/** The lists of the catalog module of the backend: my list, the downloads and the titles on disk */
export const catalogKeys = {
	/** Every list: what the mutations of a title invalidate */
	all: ['catalog'] as const,
	myList: (params: MyListParams) => ['catalog', 'my-list', params] as const,
	continueWatching: (mediaType: 'movie' | 'series') =>
		['catalog', 'my-list', 'continue-watching', mediaType] as const,
	/** Every list of the downloads: what a change of a torrent invalidates */
	downloads: () => ['catalog', 'downloads'] as const,
	downloadsList: (params: DownloadsParams) => ['catalog', 'downloads', params] as const,
	onDisk: (params: OnDiskParams) => ['catalog', 'on-disk', params] as const
};

export const catalogQueries = {
	/** The titles of the user's list */
	myList: (params: MyListParams) =>
		pagedQueryOptions({
			queryKey: catalogKeys.myList(params),
			queryFn: (page) => reiverrApi.catalog.getMyList({ ...params, page }).then((r) => r.data.items)
		}),
	/** The row of the home pages: the last played titles of the user's list that are in progress */
	continueWatching: (mediaType: 'movie' | 'series') =>
		queryOptions({
			queryKey: catalogKeys.continueWatching(mediaType),
			queryFn: () =>
				reiverrApi.catalog
					.getMyList({
						mediaType,
						order: 'last-played',
						status: 'continue-watching',
						itemsPerPage: 10
					})
					.then((r) => r.data.items)
		}),
	/** The torrents that are downloading, live: polled while there are any, told by the server otherwise */
	downloads: (params: DownloadsParams) =>
		queryOptions({
			queryKey: catalogKeys.downloadsList(params),
			queryFn: () => reiverrApi.catalog.getDownloads(params).then((r) => r.data),
			refetchInterval: (query) => (query.state.data?.length ? LIVE_REFRESH_INTERVAL : false)
		}),
	/** The titles with files in the library, what they take, and what the requests of the user hold of them */
	onDisk: (params: OnDiskParams) =>
		pagedQueryOptions({
			queryKey: catalogKeys.onDisk(params),
			queryFn: (page) =>
				reiverrApi.catalog
					.getOnDisk({ ...params, page, itemsPerPage: ON_DISK_PAGE_SIZE })
					.then((r) => r.data.items)
		})
};
