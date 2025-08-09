import type { ComponentType, SvelteComponentTyped } from 'svelte';
import { derived, get, writable } from 'svelte/store';

type ModalItem = {
	id: symbol;
	group: symbol;
	component: ComponentType;
	props: Record<string, any>;
};

export function createModalStack() {
	const items = writable<ModalItem[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	function create<P extends Record<string, any>>(
		component: ComponentType<SvelteComponentTyped<P>>,
		props: Omit<P, 'modal' | 'groupId' | 'modalId' | 'hidden'>,
		group: symbol | undefined = undefined
	) {
		const id = Symbol();
		const item = { id, component, props, group: group || id };
		items.update((prev) => [...prev, item]);
		return id;
	}

	function reset() {
		items.set([]);
	}

	function closeTopmost() {
		const t = get(top);
		if (t) {
			close(t.id);
		}
	}

	return {
		subscribe: items.subscribe,
		top: {
			subscribe: top.subscribe
		},
		create,
		close,
		closeGroup,
		closeTopmost,
		reset
	};
}

export const modalStack = createModalStack();
export const modalStackTop = modalStack.top;
export const createModal = modalStack.create;
