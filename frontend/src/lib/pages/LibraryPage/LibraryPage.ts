import { createLocalStorageStore } from '$lib/stores/localstorage.store';

export type MyListOrder = 'date-added' | 'name' | 'first-release-date' | 'last-release-date';
export type MyListOrderDirection = 'asc' | 'desc';

export const libraryViewSettings = createLocalStorageStore<{
	order: MyListOrder;
	direction: MyListOrderDirection;
	separateWatched: boolean;
}>('library-view-settings', {
	order: 'last-release-date',
	direction: 'desc',
	separateWatched: true
});
