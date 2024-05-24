import { writable } from 'svelte/store';

enum TestTabs {
	Tab1 = 'Tab1',
	Tab2 = 'Tab2',
	Tab3 = 'Tab3'
}

const test = useTabs<TestTabs>(TestTabs.Tab1);

export function useTabs<T extends string>(defaultTab: T) {
	const tab = writable<string>(defaultTab);

	return { subscribe: tab.subscribe };
}
