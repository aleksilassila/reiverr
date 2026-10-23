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
			reiverrApi.myList
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
			reiverrApi.myList
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
			reiverrApi.myList
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

export type AvailableOrder = 'date-added' | 'name' | 'first-release-date' | 'last-release-date';

/** The titles with files in the library: those the user requested, and the rest */
export const availableContext = createStoreContext(`library-available`, () => {
	const category = writable<'all' | 'series' | 'movies'>('all');
	const viewSettings = createLocalStorageStore<{
		order: AvailableOrder;
		direction: MyListOrderDirection;
		separateRequested: boolean;
	}>('library-available-view-settings', {
		order: 'date-added',
		direction: 'desc',
		separateRequested: true
	});
	const query = () => {
		const selected = get(category);
		const settings = get(viewSettings);

		return {
			mediaType:
				selected === 'all'
					? undefined
					: selected === 'movies'
						? ('movie' as const)
						: ('series' as const),
			order: settings.order,
			direction: settings.direction
		};
	};

	// Grouped, the first list is the requested titles and the second the rest; else the first is every title
	const requested = usePaginatedData(
		(page) =>
			reiverrApi.library
				.getTitles({
					...query(),
					...(get(viewSettings).separateRequested ? { status: 'requested' as const } : {}),
					page
				})
				.then((r) => r.data.items),
		{ initialize: false }
	);
	const unrequested = usePaginatedData(
		(page) =>
			get(viewSettings).separateRequested
				? reiverrApi.library
						.getTitles({ ...query(), status: 'unrequested', page })
						.then((r) => r.data.items)
				: Promise.resolve([]),
		{ initialize: false }
	);

	const unsubscribe = betterSubscribe(
		derived([category, viewSettings], () => {
			requested.reset();
			unrequested.reset();
		}),
		() => {}
	);

	return {
		category,
		viewSettings,
		requested,
		unrequested,
		unsubscribe
	};
});
