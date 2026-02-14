import { betterSubscribe, createStoreContext } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { usePaginatedData, useStaleable } from './data.store';
import { createLocalStorageStore } from '../localstorage.store';
import { reiverrApi, user } from '../user.store';

export type MyListOrder = 'date-added' | 'name' | 'first-release-date' | 'last-release-date';
export type MyListOrderDirection = 'asc' | 'desc';

export const libraryContext = createStoreContext(`library`, () => {
	const category = writable<'all' | 'series' | 'movies'>('all');
	const libraryViewSettings = createLocalStorageStore<{
		order: MyListOrder;
		direction: MyListOrderDirection;
		separateWatched: boolean;
	}>('library-view-settings', {
		order: 'last-release-date',
		direction: 'desc',
		separateWatched: true
	});

	const upcoming = usePaginatedData(
		(page) =>
			reiverrApi.library
				.getMyList(String(get(user)?.id), {
					type: 'series',
					order: 'last-played',
					status: 'continue-watching',
					page
				})
				.then((r) => r.data.items),
		{ initialize: false }
	);

	const watched = usePaginatedData(
		(page) =>
			reiverrApi.library
				.getMyList(String(get(user)?.id), {
					status: 'watched',
					type: get(category),
					order: get(libraryViewSettings).order,
					direction: get(libraryViewSettings).direction,
					page
				})
				.then((i) => i.data.items),
		{ initialize: false }
	);

	watched.subscribe((items) => console.log('Watched items:', items));

	const unwatched = usePaginatedData(
		(page) =>
			reiverrApi.library
				.getMyList(String(get(user)?.id), {
					type: get(category),
					order: get(libraryViewSettings).order,
					direction: get(libraryViewSettings).direction,
					...(get(libraryViewSettings).separateWatched ? { status: 'unwatched' } : {}),
					page
				})
				.then((i) => i.data.items),
		{ initialize: false }
	);

	const { setStale, unsubscribe: unsubStale } = useStaleable(async () => {
		upcoming.reset();
		watched.reset();
		unwatched.reset();
	});

	const unsubscribe = betterSubscribe(
		derived([category, libraryViewSettings], () => {
			upcoming.reset();
			watched.reset();
			unwatched.reset();
		}),
		() => {}
	);

	return {
		category,
		libraryViewSettings,
		upcoming,
		watched,
		unwatched,
		setStale,
		unsubscribe: () => {
			unsubStale();
			unsubscribe();
		}
	};
});
