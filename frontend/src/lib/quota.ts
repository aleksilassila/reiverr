import ConfirmDialog from './components/Dialog/ConfirmDialog.svelte';
import { createModal } from './components/Modal/modal.store';
import { queryClient } from './queries/query-client';
import { storageQueries } from './queries/storage.queries';
import { formatSize } from './utils';

/**
 * What the download of an episode from a release is expected to take, as the server
 * estimates it: the release, or an episode's share of a season pack
 */
export function expectedBytes(
	releaseSize: number,
	forEpisode: boolean,
	episodesInSeason: number | undefined
): number {
	return forEpisode || !episodesInSeason ? releaseSize : Math.ceil(releaseSize / episodesInSeason);
}

/**
 * Warns when what the requests of the user are about to get may not fit their quota.
 * Resolves to whether to go on: at once when it fits or there is no quota, else as the user decides.
 */
export async function confirmQuota(bytes: number): Promise<boolean> {
	if (bytes <= 0) return true;

	// Read again: the usage changes with every request and download
	const usage = await queryClient.fetchQuery({ ...storageQueries.user(), staleTime: 0 });
	const quota = usage.quotaBytes;
	if (quota === null) return true;

	const left = quota - usage.heldBytes - usage.pendingBytes;
	if (bytes <= left) return true;

	return new Promise((resolve) =>
		createModal(ConfirmDialog, {
			header: 'Might exceed your quota',
			body:
				`This is expected to take ${formatSize(bytes)}, and ${formatSize(Math.max(0, left))} ` +
				`of your quota is left. ` +
				'Requests that do not fit wait until there is room.',
			confirm: () => resolve(true),
			cancel: () => resolve(false)
		})
	);
}
