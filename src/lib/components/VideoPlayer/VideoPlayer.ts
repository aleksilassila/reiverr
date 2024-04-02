import { writable } from 'svelte/store';
import { modalStack } from '../Modal/modal.store';
import { jellyfinItemsStore } from '../../stores/data.store';
import VideoPlayerModal from './VideoPlayerModal.svelte';

const initialValue = { visible: false, jellyfinId: '' };
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	return {
		...store,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id });
			modalStack.create(VideoPlayerModal, { id });
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '' });
			jellyfinItemsStore.send();
		}
	};
}

export const playerState = createPlayerState();
