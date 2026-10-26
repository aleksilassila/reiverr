import type { DownloadSettingsDto, IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { invalidate, queryClient } from './query-client';

export const downloadsKeys = {
	settings: () => ['downloads', 'settings'] as const,
	indexers: () => ['indexers'] as const
};

export const downloadsQueries = {
	settings: () =>
		queryOptions({
			queryKey: downloadsKeys.settings(),
			queryFn: () => reiverrApi.downloads.getDownloadSettings().then((r) => r.data)
		}),
	indexers: () =>
		queryOptions({
			queryKey: downloadsKeys.indexers(),
			queryFn: () => reiverrApi.indexers.getIndexers().then((r) => r.data.indexers)
		})
};

export async function updateDownloadSettings(settings: DownloadSettingsDto) {
	const saved = await reiverrApi.downloads.updateDownloadSettings(settings).then((r) => r.data);
	queryClient.setQueryData(downloadsKeys.settings(), saved);
	return saved;
}

export async function updateIndexers(indexers: IndexerDto[]) {
	await reiverrApi.indexers.updateIndexers({ indexers });
	await invalidate(downloadsKeys.indexers());
}
