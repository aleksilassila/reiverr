import { betterSubscribe, createStoreContext, type Letter } from '$lib/utils';
import { derived, get, writable } from 'svelte/store';
import { usePaginatedData, useStaleable } from './data.store';
import { createLocalStorageStore } from '../localstorage.store';
import { reiverrApi } from '../user.store';

/** The orders the library page sorts both catalogues by; the my list also has 'last-played' */
export type CatalogOrder = 'date-added' | 'name' | 'first-release-date' | 'last-release-date';
export type CatalogOrderDirection = 'asc' | 'desc';
export type CatalogCategory = 'all' | 'series' | 'movies';

/** The media type a category of the pills asks the catalogue for */
const mediaTypeOf = (category: CatalogCategory) =>
	category === 'all' ? undefined : category === 'movies' ? ('movie' as const) : ('series' as const);

/** The titles of the user's list: those in progress, and the rest, watched or not */
export const libraryContext = createStoreContext(`library`, () => {
	const category = writable<CatalogCategory>('all');
	const letter = writable<Letter | null>(null);
	const libraryViewSettings = createLocalStorageStore<{
		order: CatalogOrder;
		direction: CatalogOrderDirection;
		separateWatched: boolean;
	}>('library-view-settings', {
		order: 'last-release-date',
		direction: 'desc',
		separateWatched: true
	});

	const upcoming = usePaginatedData(
		(page) =>
			reiverrApi.catalog
				.getMyList({
					mediaType: 'series',
					letter: get(letter) ?? undefined,
					order: 'last-played',
					status: 'continue-watching',
					page
				})
				.then((r) => r.data.items),
		{ initialize: false }
	);

	const watched = usePaginatedData(
		(page) =>
			reiverrApi.catalog
				.getMyList({
					status: 'watched',
					mediaType: mediaTypeOf(get(category)),
					letter: get(letter) ?? undefined,
					order: get(libraryViewSettings).order,
					direction: get(libraryViewSettings).direction,
					page
				})
				.then((r) => r.data.items),
		{ initialize: false }
	);

	const unwatched = usePaginatedData(
		(page) =>
			reiverrApi.catalog
				.getMyList({
					mediaType: mediaTypeOf(get(category)),
					letter: get(letter) ?? undefined,
					order: get(libraryViewSettings).order,
					direction: get(libraryViewSettings).direction,
					...(get(libraryViewSettings).separateWatched ? { status: 'unwatched' as const } : {}),
					page
				})
				.then((r) => r.data.items),
		{ initialize: false }
	);

	const { setStale, unsubscribe: unsubStale } = useStaleable(async () => {
		upcoming.reset();
		watched.reset();
		unwatched.reset();
	});

	const unsubscribe = betterSubscribe(
		derived([category, letter, libraryViewSettings], () => {
			upcoming.reset();
			watched.reset();
			unwatched.reset();
		}),
		() => {}
	);

	return {
		category,
		letter,
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

/** The titles with files in the library: those the user requested, and the rest */
export const availableContext = createStoreContext(`library-available`, () => {
	const category = writable<CatalogCategory>('all');
	const letter = writable<Letter | null>(null);
	const viewSettings = createLocalStorageStore<{
		order: CatalogOrder;
		direction: CatalogOrderDirection;
		separateRequested: boolean;
	}>('library-available-view-settings', {
		order: 'date-added',
		direction: 'desc',
		separateRequested: true
	});
	const query = () => ({
		mediaType: mediaTypeOf(get(category)),
		letter: get(letter) ?? undefined,
		order: get(viewSettings).order,
		direction: get(viewSettings).direction
	});

	// Grouped, the first list is the requested titles and the second the rest; else the first is every title
	const requested = usePaginatedData(
		(page) =>
			reiverrApi.catalog
				.getLibrary({
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
				? reiverrApi.catalog
						.getLibrary({ ...query(), status: 'unrequested', page })
						.then((r) => r.data.items)
				: Promise.resolve([]),
		{ initialize: false }
	);

	const unsubscribe = betterSubscribe(
		derived([category, letter, viewSettings], () => {
			requested.reset();
			unrequested.reset();
		}),
		() => {}
	);

	return {
		category,
		letter,
		viewSettings,
		requested,
		unrequested,
		unsubscribe
	};
});
