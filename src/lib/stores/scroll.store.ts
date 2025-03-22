import { getScrollParent } from '$lib/scroll-into-view';
import { getContext, hasContext, setContext } from 'svelte';
import type { Action } from 'svelte/action';
import { get, writable } from 'svelte/store';

const VISIBILITY_CONTEXT_KEY = Symbol('UsersContext');

function useScrollStore() {
	const scrollTop = writable(0);
	const scrollLeft = writable(0);
	const topVisible = writable(false);
	let registrant: HTMLElement | null = null;

	scrollTop.subscribe((v) => {
		const visible = v < 100;

		if (get(topVisible) !== visible) {
			topVisible.set(visible);
		}
	});

	const registrar: Action = (node) => {
		if (registrant) {
			console.error('Multiple scroll registrars detected');
			return;
		}

		registrant = node;

		const verticalScrollParent = getScrollParent(node, 'vertical', false, true);
		const horizontalScrollParent = getScrollParent(node, 'horizontal', false, true);

		function handler() {
			scrollTop.update((prev) => (verticalScrollParent ? verticalScrollParent.scrollTop : prev));
			scrollLeft.update((prev) =>
				horizontalScrollParent ? horizontalScrollParent.scrollLeft : prev
			);
		}

		verticalScrollParent?.addEventListener('scroll', handler);

		return {
			destroy: () => {
				registrant = null;
				verticalScrollParent?.removeEventListener('scroll', handler);
			}
		};
	};

	return {
		scrollTop,
		scrollLeft,
		topVisible,
		registrar
	};
}

export type ScrollStore = ReturnType<typeof useScrollStore>;

export function setScrollContext() {
	const store = useScrollStore();
	setContext(VISIBILITY_CONTEXT_KEY, store);
	return store;
}

export function getScrollContext(): Partial<ScrollStore> {
	if (hasContext(VISIBILITY_CONTEXT_KEY)) return getContext(VISIBILITY_CONTEXT_KEY);

	return {};
}
