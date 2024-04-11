import { writable } from 'svelte/store';
import { modalStack } from '../../components/Modal/modal.store';
import { jellyfinItemsStore } from '../../stores/data.store';
import JellyfinVideoPlayerModal from '../../components/VideoPlayer/JellyfinVideoPlayerModal.svelte';

const initialValue = { visible: false, jellyfinId: '' };
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	return {
		...store,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id });
			modalStack.create(JellyfinVideoPlayerModal, {
				id
			}); // FIXME
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '' });
			jellyfinItemsStore.send();
		}
	};
}

export const playerState = createPlayerState();
