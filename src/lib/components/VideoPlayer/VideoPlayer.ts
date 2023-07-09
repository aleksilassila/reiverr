import { writable } from 'svelte/store';

const initialValue = { visible: false, jellyfinId: '' };
export const playerState = writable(initialValue);

export const initialPlayerState = {
	playerState,
	close: () => {
		playerState.set({ visible: false, jellyfinId: '' });
	},
	streamJellyfinId: (id: string) => {
		playerState.set({ visible: true, jellyfinId: id });
	}
};

export type PlayerState = typeof initialPlayerState;
export type PlayerStateValue = typeof initialValue;
