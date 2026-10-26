import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { pagedQueryOptions } from './query-client';

type MyListParams = Omit<
	NonNullable<Parameters<typeof reiverrApi.catalog.getMyList>[0]>,
	'page' | 'itemsPerPage'
>;
type LibraryParams = Omit<
	NonNullable<Parameters<typeof reiverrApi.catalog.getLibrary>[0]>,
	'page' | 'itemsPerPage'
>;

/** The orders the library page sorts both catalogues by; the my list also has 'last-played' */
export type CatalogOrder = 'date-added' | 'name' | 'first-release-date' | 'last-release-date';
export type CatalogOrderDirection = 'asc' | 'desc';
export type CatalogCategory = 'all' | 'series' | 'movies';

/** The media type a category of the pills asks the catalogue for */
export const mediaTypeOf = (category: CatalogCategory) =>
	category === 'all' ? undefined : category === 'movies' ? ('movie' as const) : ('series' as const);

/** The lists of titles of the catalog module of the backend: my list and the library */
export const catalogKeys = {
	/** Every list: what the mutations of a title invalidate */
	all: ['catalog'] as const,
	myList: (params: MyListParams) => ['catalog', 'my-list', params] as const,
	continueWatching: (mediaType: 'movie' | 'series') =>
		['catalog', 'my-list', 'continue-watching', mediaType] as const,
	library: (params: LibraryParams) => ['catalog', 'library', params] as const
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
	/** The titles with files in the library */
	library: (params: LibraryParams) =>
		pagedQueryOptions({
			queryKey: catalogKeys.library(params),
			queryFn: (page) =>
				reiverrApi.catalog.getLibrary({ ...params, page }).then((r) => r.data.items)
		})
};
