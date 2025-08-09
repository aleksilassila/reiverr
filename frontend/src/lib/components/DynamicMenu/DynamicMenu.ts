import { writable } from 'svelte/store';

export type MenuStack = ReturnType<typeof useMenuStack>;

export function useMenuStack() {
	type Page = {
		id: symbol;
	};

	const pages = writable<Page[]>([]);

	function addPage(id: symbol) {
		const page: Page = { id };
		pages.update((p) => [...p, page]);
	}

	function removePage(id: symbol) {
		pages.update((p) => {
			return p.filter((page) => page.id !== id);
		});
	}

	return {
		subscribe: pages.subscribe,
		addPage,
		removePage
	};
}
