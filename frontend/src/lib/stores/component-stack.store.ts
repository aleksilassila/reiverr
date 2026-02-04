import { createStoreContext } from '$lib/utils';
import { type ComponentProps, type ComponentType, type SvelteComponentTyped } from 'svelte';
import { derived, get, writable } from 'svelte/store';

export type ComponentPage<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	id: symbol;
	group: symbol;
	component: ComponentType<T>;
	props: ComponentProps<T>;
	preventScroll: boolean;
};

export type ComponentStackStore = ReturnType<typeof useComponentStack>;

export function useComponentStack<P extends Record<string, unknown>>(initial?: {
	component: ComponentType<SvelteComponentTyped<P>>;
	props: P;
	group?: symbol | undefined;
}) {
	const items = writable<ComponentPage<SvelteComponentTyped>[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);

	if (initial) {
		push({
			component: initial.component,
			props: initial.props,
			group: initial.group
		});
	}

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	function push<P extends Record<string, unknown>>(opts: {
		component: ComponentType<SvelteComponentTyped<P>>;
		props: P;
		group?: symbol;
		preventScroll?: boolean;
	}) {
		const { component, props, group, preventScroll } = opts;

		const id = Symbol();
		const item = {
			id,
			component,
			props,
			group: group || id,
			preventScroll: preventScroll || false
		};
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
		push,
		close,
		closeGroup,
		closeTopmost,
		pop: closeTopmost,
		reset
	};
}

export const componentStackContext = createStoreContext('component-stack', useComponentStack, {
	required: true
});
