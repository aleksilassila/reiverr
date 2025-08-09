import { PLATFORM_TV } from '$lib/constants';
import { writable } from 'svelte/store';

const KEYS: Record<string, boolean> = {
	Enter: true,
	' ': true,
	ArrowUp: true,
	ArrowDown: true,
	ArrowLeft: true,
	ArrowRight: true,
	Escape: true
};

function useInputMode() {
	const keyboardMode = writable(PLATFORM_TV);

	function handleMouseMove(e: MouseEvent) {
		if (PLATFORM_TV) return;

		keyboardMode.set(false);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (PLATFORM_TV) return;

		if (KEYS[e.key]) {
			keyboardMode.set(true);
		}
	}

	return { subscribe: keyboardMode.subscribe, handleMouseMove, handleKeyDown };
}

export const inputMode = useInputMode();
