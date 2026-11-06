import type { DeleteLibraryEntriesDto, LibraryEntriesDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { libraryKeys } from './library.queries';
import { invalidate } from './query-client';
import { requestsKeys } from './requests.queries';
import { serverLogKeys } from './server-log.queries';
import { storageKeys } from './storage.queries';

export const serverKeys = {
	all: ['server'] as const,
	/** Every folder listing: what a change of the files on the server invalidates */
	library: () => [...serverKeys.all, 'library'] as const,
	libraryEntries: (folder: string) => [...serverKeys.library(), folder] as const,
	cleanupPreview: () => [...serverKeys.all, 'cleanup'] as const,
	directories: (path: string) => [...serverKeys.all, 'directories', path] as const
};

export const serverQueries = {
	/** Everything in a library folder, as a flat list */
	libraryEntries: (folder: string) =>
		queryOptions({
			queryKey: serverKeys.libraryEntries(folder),
			queryFn: () => reiverrApi.server.getLibraryEntries({ folder }).then((r) => r.data)
		}),
	/** What the cleanup would delete now, library-wide */
	cleanupPreview: () =>
		queryOptions({
			queryKey: serverKeys.cleanupPreview(),
			queryFn: () => reiverrApi.server.previewCleanup().then((r) => r.data)
		}),
	/** The folders in a folder on the server, for picking a library folder */
	directories: (path: string) =>
		queryOptions({
			queryKey: serverKeys.directories(path),
			queryFn: () => reiverrApi.server.getDirectories({ path }).then((r) => r.data)
		})
};

/** What the files on the server change: the files, the lists, the usage, the requests, the library and the log */
const filesChanged = () =>
	invalidate(
		serverKeys.all,
		catalogKeys.all,
		storageKeys.all,
		requestsKeys.all,
		libraryKeys.all,
		serverLogKeys.all
	);

/** Resolves with the result once what it changed is invalidated, also when the result has failures */
async function changingFiles<T>(change: Promise<{ data: T }>): Promise<T> {
	try {
		return (await change).data;
	} finally {
		await filesChanged();
	}
}

export const deleteLibraryEntries = (entries: DeleteLibraryEntriesDto) =>
	changingFiles(reiverrApi.server.deleteLibraryEntries(entries));

export const requestLibraryEntries = (entries: LibraryEntriesDto) =>
	changingFiles(reiverrApi.server.requestLibraryEntries(entries));

export const manageLibraryEntries = (entries: LibraryEntriesDto) =>
	changingFiles(reiverrApi.server.manageLibraryEntries(entries));

export const unmanageLibraryEntries = (entries: LibraryEntriesDto) =>
	changingFiles(reiverrApi.server.unmanageLibraryEntries(entries));

/** With `force`, the files of a folder that does not read as mounted are forgotten too */
export const scanLibrary = (folder: string, force: boolean) =>
	changingFiles(reiverrApi.server.scanLibrary({ folder, force }));

export const runCleanup = () => changingFiles(reiverrApi.server.runCleanup());

/** What a scan of the folder would forget, for its confirmation */
export const previewLibraryScan = (folder: string) =>
	reiverrApi.server.previewLibraryScan({ folder }).then((r) => r.data);
