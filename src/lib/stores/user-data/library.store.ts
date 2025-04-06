import type { MovieUserDataDto, SeriesUserDataDto } from '$lib/apis/reiverr/reiverr.openapi';
import { get_store_value as get } from 'svelte/internal';
import { type Readable, writable } from 'svelte/store';
import { libraryRefresher } from '../data.store';
import { reiverrApi, user } from '../user.store';

export function useUserLibrary(
	mediaType: 'movie' | 'series',
	tmdbId: string,
	userData: Readable<MovieUserDataDto | SeriesUserDataDto | undefined>
) {
	const inLibrary = writable<boolean>(undefined);

	userData.subscribe((d) => {
		inLibrary.set(d?.inLibrary ?? false);
	});

	async function handleAddToLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Add to library: No user ID');
			return;
		}

		const success = await reiverrApi.library
			.addLibraryItem(userId, tmdbId, { mediaType })
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(true);
			libraryRefresher.refreshIn(1500);
		}
	}

	async function handleRemoveFromLibrary() {
		const userId = get(user)?.id;

		if (!userId) {
			console.error('Remove from library: No user ID');
			return;
		}

		const success = await reiverrApi.library
			.removeLibraryItem(userId, tmdbId)
			.then((r) => r.data.success);
		if (success) {
			inLibrary.set(false);
			libraryRefresher.refreshIn(500);
		}
	}

	return {
		inLibrary,
		handleAddToLibrary,
		handleRemoveFromLibrary
	};
}
