import type { MovieUserDataDto } from '$lib/apis/reiverr/reiverr.openapi';
import { get_store_value as get } from 'svelte/internal';
import { type Readable, writable } from 'svelte/store';
import { libraryRefresher } from '../data.store';
import { user } from '../user.store';

export function useIsWatched(
	userData: Readable<MovieUserDataDto | undefined>,
	toggleFn: (userId: string, watched: boolean) => Promise<any>
) {
	const isWatched = writable<boolean>(undefined);

	userData.subscribe((d) => {
		isWatched.set(d?.playState?.watched ?? false);
	});

	async function toggleIsWatched() {
		const watched = get(isWatched);
		const userId = get(user)?.id;

		if (!userId) {
			return;
		}

		return toggleFn(userId, !watched).finally(() => {
			isWatched.set(!watched);
			libraryRefresher.refreshIn(500);
		});
	}

	return {
		isWatched,
		toggleIsWatched
	};
}
