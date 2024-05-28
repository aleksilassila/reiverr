import { writable } from 'svelte/store';

export function useTabs(defaultTab: number) {
	const openTab = writable<number>(defaultTab);

	const next = () => openTab.update((n) => n + 1);
	const previous = () => openTab.update((n) => n - 1);

	return { subscribe: openTab.subscribe, openTab, set: openTab.set, next, previous };
}
