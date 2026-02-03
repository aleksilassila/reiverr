import type { MovieUserDataDto, SeriesUserDataDto } from '$lib/apis/reiverr/reiverr.openapi';
import { get_store_value as get } from 'svelte/internal';
import { type Readable, writable } from 'svelte/store';
import { libraryRefresher } from '../data.store';
import { user } from '../user.store';
import type { EpisodeUserData } from './title-user-data.store';

export type WatchStore = {
	isWatched: Readable<boolean>;
	toggleIsWatched: () => Promise<void>;
};

export function useIsWatched(opts: {
	userData: Readable<MovieUserDataDto | SeriesUserDataDto | EpisodeUserData | undefined>;
	season?: number;
	episode?: number;
	toggleFn: (userId: string, watched: boolean) => Promise<any>;
}): WatchStore {
	const isWatched = writable<boolean>(undefined);

	opts.userData.subscribe((d) => {
		if (d && 'playState' in d) {
			isWatched.set(d.playState?.watched ?? false);
		} else if (d && 'playStates' in d) {
			isWatched.set(
				opts.season !== undefined && opts.episode !== undefined
					? (d.playStates.find((p) => p.episode === opts.episode && p.season === opts.season)
							?.watched ?? false)
					: d.playStates.every((e) => e.watched) // || e.upcoming
			);
		} else if (d && 'upcoming' in d) {
			isWatched.set(d.watched || d.upcoming);
		} else {
			isWatched.set(false);
		}
	});

	async function toggleIsWatched() {
		const watched = get(isWatched);
		const userId = get(user)?.id;

		if (!userId) {
			return;
		}

		return opts
			.toggleFn(userId, !watched)
			.then(() => {
				isWatched.set(!watched);
			})
			.catch(() => {})
			.finally(() => {
				libraryRefresher.refreshIn(500);
			});
	}

	return {
		isWatched,
		toggleIsWatched
	};
}
