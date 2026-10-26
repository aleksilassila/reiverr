import type { LibrarySettingsDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { queryClient } from './query-client';

export const libraryKeys = {
	settings: () => ['library', 'settings'] as const
};

export const libraryQueries = {
	/** The library folders, the cleanup schedule and the disk limit */
	settings: () =>
		queryOptions({
			queryKey: libraryKeys.settings(),
			queryFn: () => reiverrApi.library.getLibrarySettings().then((r) => r.data)
		})
};

/** With `force`, the indexed files of a removed folder are forgotten */
export async function updateLibrarySettings(settings: LibrarySettingsDto, force = false) {
	const saved = await reiverrApi.library
		.updateLibrarySettings(settings, force ? { force } : undefined)
		.then((r) => r.data);
	queryClient.setQueryData(libraryKeys.settings(), saved);
	return saved;
}
