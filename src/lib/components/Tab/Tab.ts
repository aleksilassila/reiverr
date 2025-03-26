import type { ComponentProps } from 'svelte';
import { writable } from 'svelte/store';
import type Tab from './Tab.svelte';

export function useTabs(defaultTab: number, props: Partial<ComponentProps<Tab>> = {}) {
	const openTab = writable<number>(defaultTab);

	const next = () => openTab.update((n) => n + 1);
	const previous = () => openTab.update((n) => n - 1);

	return { subscribe: openTab.subscribe, openTab, set: openTab.set, next, previous, ...props };
}
