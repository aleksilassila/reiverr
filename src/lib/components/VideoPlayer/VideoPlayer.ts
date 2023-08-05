import { library } from '$lib/stores/library.store';
import { writable } from 'svelte/store';

const initialValue = { visible: false, jellyfinId: '' };
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	return {
		...store,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id });
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '' });
			library.refresh();
		}
	};
}

export const playerState = createPlayerState();
