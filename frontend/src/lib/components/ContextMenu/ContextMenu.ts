import { writable } from 'svelte/store';

function createContextMenu() {
	const visibleItem = writable<symbol | null>(null);

	return {
		subscribe: visibleItem.subscribe,
		show: (item: symbol) => {
			visibleItem.set(item);
		},
		hide: () => {
			visibleItem.set(null);
		}
	};
}

export const contextMenu = createContextMenu();
