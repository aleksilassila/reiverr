import type { ComponentProps } from 'svelte';
import { writable } from 'svelte/store';
import type Tab from './Tab.svelte';

/** TODO: named parameters */
export function useTabs(defaultTab: number = 0, props: Partial<ComponentProps<Tab>> = {}) {
	const openTab = writable<number>(defaultTab);

	const next = () => openTab.update((n) => n + 1);
	const previous = () => openTab.update((n) => n - 1);

	return { subscribe: openTab.subscribe, openTab, set: openTab.set, next, previous, ...props };
}
