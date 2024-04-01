import { derived, writable } from 'svelte/store';

type ModalItem = {
	id: symbol;
	group: symbol;
	component: ConstructorOfATypedSvelteComponent;
	props: Record<string, any>;
};
function createModalStack() {
	const items = writable<ModalItem[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	function create(
		component: ConstructorOfATypedSvelteComponent,
		props: Record<string, any>,
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

	return {
		subscribe: items.subscribe,
		top: {
			subscribe: top.subscribe
		},
		create,
		close,
		closeGroup,
		reset
	};
}

export const modalStack = createModalStack();
export const modalStackTop = modalStack.top;

// let lastTitleModal: symbol | undefined = undefined;
// export function openTitleModal(titleId: TitleId) {
// 	if (lastTitleModal) {
// 		modalStack.close(lastTitleModal);
// 	}
// 	lastTitleModal = modalStack.create(TitlePageModal, {
// 		titleId
// 	});
// }
