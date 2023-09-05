import type { TitleType } from '$lib/types';
import { writable } from 'svelte/store';

type Type = TitleType | undefined;

function createPersonPageModalStore() {
	const store = writable<{ personId: number | undefined; type: Type }>({
		personId: undefined,
		type: undefined
	});

	return {
		subscribe: store.subscribe,
		set: (personId: number | undefined, type: Type) => store.set({ personId, type }),
		close: () => store.set({ personId: undefined, type: undefined })
	};
}

export const personPageModal = createPersonPageModalStore();
