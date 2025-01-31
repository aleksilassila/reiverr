import { get, writable } from 'svelte/store';
import { reiverrApiNew, user } from './user.store';
import type { MediaUserDataDto } from '../apis/reiverr/reiverr.openapi';
import type { MediaType } from '../types';

export function useUserData(
	mediaType: MediaType,
	tmdbId: string,
	userDataP: Promise<MediaUserDataDto>
) {
	const inLibrary = writable<boolean>(undefined);
	const progress = writable(0);

	userDataP.then((d) => {
		inLibrary.set(d?.inLibrary ?? false);
		progress.set(d?.playState?.progress ?? 0);
	});

	async function handleAddToLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApiNew.users
			.addLibraryItem(userId, tmdbId, { mediaType })
			.then((r) => r.data.success);
		if (success) inLibrary.set(true);
	}

	async function handleRemoveFromLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Remove from library: No user ID');
			return;
		}

		const success = await reiverrApiNew.users
			.removeLibraryItem(userId, tmdbId)
			.then((r) => r.data.success);
		if (success) inLibrary.set(false);
	}

	return {
		inLibrary,
		progress,
		handleAddToLibrary,
		handleRemoveFromLibrary
	};
}
