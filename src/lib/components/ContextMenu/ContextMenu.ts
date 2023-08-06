import { writable } from 'svelte/store';

function createContextMenu() {
	const visibleItem = writable<Symbol | null>(null);

	return {
		subscribe: visibleItem.subscribe,
		show: (item: Symbol) => {
			visibleItem.set(item);
		},
		hide: () => {
			visibleItem.set(null);
		}
	};
}

export const contextMenu = createContextMenu();
