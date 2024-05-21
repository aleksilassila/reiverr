import { jellyfinItemsStore } from '$lib/stores/data.store';
import { writable } from 'svelte/store';
import { modalStack } from '../../stores/modal.store';
import VideoPlayer from './VideoPlayer.svelte';

const initialValue = { visible: false, jellyfinId: '' };
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	return {
		...store,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id });
			modalStack.create(VideoPlayer, {}); // FIXME
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '' });
			jellyfinItemsStore.refresh();
		}
	};
}

export const playerState = createPlayerState();
