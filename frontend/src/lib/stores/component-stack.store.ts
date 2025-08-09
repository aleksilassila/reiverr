import { createStoreContext } from '$lib/utils';
import { type ComponentProps, type ComponentType, type SvelteComponentTyped } from 'svelte';
import { derived, get, writable } from 'svelte/store';

export type ComponentPage<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	id: symbol;
	group: symbol;
	component: ComponentType<T>;
	props: ComponentProps<T>;
};

export type ComponentStackStore = ReturnType<typeof useComponentStack>;

export function useComponentStack<P extends Record<string, unknown>>(initial?: {
	component: ComponentType<SvelteComponentTyped<P>>;
	props: P;
	group?: symbol | undefined;
}) {
	const items = writable<ComponentPage<any>[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);

	if (initial) {
		create(initial.component, initial.props, initial.group);
	}

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	function create<P extends Record<string, unknown>>(
		component: ComponentType<SvelteComponentTyped<P>>,
		props: P,
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
		pop: closeTopmost,
		reset
	};
}

export type ComponentStackContext = ReturnType<typeof useComponentStackContext>;
type ContextProvider = ReturnType<ComponentStackContext['getContextProvider']>;

export function useComponentStackContext() {
	const contexts: Record<string, { index: number; context: unknown }[]> = {};

	function getContextProvider(index: number) {
		function setContext<T = any>(key: string, context: T) {
			if (!contexts[key]) {
				contexts[key] = [];
			}

			const prev = contexts[key].find((ctx) => ctx.index === index);

			if (prev) {
				prev.context = context;
			} else {
				contexts[key].push({ index, context });
			}
		}

		function hasContext(key: string) {
			return !!contexts[key];
		}

		function getContext<T = any>(key: string): T;
		function getContext(key: string) {
			const context = contexts[key] || [];

			for (let i = context.length - 1; i >= 0; i--) {
				const ctx = context[i];

				if (!ctx) continue;

				if (ctx.index <= index) {
					return ctx.context;
				}
			}
		}

		return {
			setContext,
			getContext,
			hasContext
		};
	}

	return { getContextProvider };
}

export const componentStackContextProvider = createStoreContext(
	'component-stack-context',
	(context: ComponentStackContext, index: number) => context.getContextProvider(index),
	{ required: true }
);
