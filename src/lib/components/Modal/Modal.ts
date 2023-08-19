import type { TitleType } from '$lib/types';
import { writable } from 'svelte/store';
import TitlePageModal from '../TitlePageLayout/TitlePageModal.svelte';

type ModalItem = {
	id: symbol;
	group: symbol;
	component: ConstructorOfATypedSvelteComponent;
	props: Record<string, any>;
};
function createDynamicModalStack() {
	const store = writable<{ stack: ModalItem[]; top: ModalItem | undefined }>({
		stack: [],
		top: undefined
	});

	function close(symbol: symbol) {
		store.update((s) => {
			s.stack = s.stack.filter((i) => i.id !== symbol);
			s.top = s.stack[s.stack.length - 1];
			return s;
		});
	}

	function closeGroup(group: symbol) {
		store.update((s) => {
			s.stack = s.stack.filter((i) => i.group !== group);
			s.top = s.stack[s.stack.length - 1];
			return s;
		});
	}

	function create(
		component: ConstructorOfATypedSvelteComponent,
		props: Record<string, any>,
		group: symbol | undefined = undefined
	) {
		const id = Symbol();
		const item = { id, component, props, group: group || id };
		store.update((s) => {
			s.stack.push(item);
			s.top = item;
			return s;
		});
		return id;
	}

	function reset() {
		store.set({ stack: [], top: undefined });
	}

	return {
		...store,
		create,
		close,
		closeGroup,
		reset
	};
}

export const modalStack = createDynamicModalStack();

let lastTitleModal: symbol | undefined = undefined;
export function openTitleModal(tmdbId: number, type: TitleType) {
	if (lastTitleModal) {
		modalStack.close(lastTitleModal);
	}
	lastTitleModal = modalStack.create(TitlePageModal, { tmdbId, type });
}
