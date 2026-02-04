import { _createStoreContext, useSubscribes } from '$lib/utils';
import {
	getContext as getSvelteContext,
	type ComponentProps,
	type ComponentType,
	type SvelteComponentTyped
} from 'svelte';
import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

export type CreateComponentPageOptions<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	component: ComponentType<T>;
	props: ComponentProps<T>;
	id?: symbol;
	group?: symbol | 'top';
	preventScroll?: boolean;
	trapFocus?: boolean;
	sidebar?: boolean;
};

export type ComponentPage<T extends SvelteComponentTyped = SvelteComponentTyped> = {
	id: symbol;
	group: symbol;
	component: ComponentType<T>;
	props: ComponentProps<T>;
	preventScroll: boolean;
	trapFocus: boolean;
	sidebar: boolean | undefined;
	context: Record<string, unknown>;
	hasFocus: Readable<boolean>;
	setContext<U = unknown>(key: string, value: U): void;
	hasContext(key: string): boolean;
	getContext<U = unknown>(key: string): U;
	_setFocus(value: boolean): void;
};

function useComponentPage<T extends SvelteComponentTyped = SvelteComponentTyped>(opts: {
	component: ComponentType<T>;
	props: ComponentProps<T>;
	group?: symbol;
	previousContext?: Record<string, unknown>;
	preventScroll?: boolean;
	trapFocus?: boolean;
	sidebar?: boolean;
	id?: symbol;
}): ComponentPage<T> {
	const id = opts.id ?? Symbol();
	const group = opts.group ?? id;
	const context = {
		...(opts.previousContext ?? {})
	};
	const hasFocus = writable(false);

	function setContext<U = unknown>(key: string, value: U): void {
		context[key] = value;
	}

	function hasContext(key: string): boolean {
		return key in context;
	}

	function getContext<U = unknown>(key: string): U {
		return context[key] as U;
	}

	function _setFocus(value: boolean) {
		hasFocus.set(value);
	}

	return {
		id,
		group,
		component: opts.component,
		props: opts.props,
		preventScroll: opts.preventScroll ?? false,
		trapFocus: opts.trapFocus ?? true,
		sidebar: opts.sidebar,
		hasFocus,
		context,
		setContext,
		hasContext,
		getContext,
		_setFocus
	};
}

// export class ComponentPage<T extends SvelteComponentTyped = SvelteComponentTyped> {
// 	id: symbol;
// 	group: symbol;
// 	component: ComponentType<T>;
// 	props: ComponentProps<T>;
// 	preventScroll: boolean;
// 	trapFocus: boolean;
// 	sidebar: boolean | undefined;
// 	context: Record<string, unknown>;
// 	hasFocus: Readable<boolean>;

// 	constructor(opts: {
// 		component: ComponentType<T>;
// 		props: ComponentProps<T>;
// 		hasFocus: Readable<boolean>;
// 		group?: symbol;
// 		previousContext?: Record<string, unknown>;
// 		preventScroll?: boolean;
// 		trapFocus?: boolean;
// 		sidebar?: boolean;
// 		id?: symbol;
// 	}) {
// 		this.id = opts.id ?? Symbol();
// 		this.group = opts.group ?? this.id;
// 		this.component = opts.component;
// 		this.props = opts.props;
// 		this.preventScroll = opts.preventScroll ?? false;
// 		this.trapFocus = opts.trapFocus ?? true;
// 		this.sidebar = opts.sidebar;
// 		this.context = {
// 			...(opts.previousContext ?? {})
// 		};
// 		this.hasFocus = opts.hasFocus;
// 	}

// 	setContext<U = unknown>(key: string, value: U): void {
// 		this.context[key] = value;
// 	}

// 	hasContext(key: string): boolean {
// 		return key in this.context;
// 	}

// 	getContext<U = unknown>(key: string): U {
// 		return this.context[key] as U;
// 	}
// }

export type ComponentStackStore = ReturnType<typeof useComponentStack>;

export function useComponentStack(initial?: { context?: Record<string, unknown> }) {
	const items = writable<ComponentPage<SvelteComponentTyped>[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);
	const initialContext: Record<string, unknown> = initial?.context ?? {};

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	// function set(pages: Array<CreateComponentPageOptions>) {
	// 	const items = pages.map((opts) =>
	// 		useComponentPage({
	// 			...opts,
	// 			group: opts.group === 'top' ? get(top)?.group : opts.group,
	// 			previousContext: initialContext
	// 		})
	// 	);
	// }

	function push<P extends Record<string, unknown>>(opts: {
		component: ComponentType<SvelteComponentTyped<P>>;
		props: P;
		id?: symbol;
		group?: symbol | 'top';
		preventScroll?: boolean;
		trapFocus?: boolean;
		sidebar?: boolean;
	}) {
		const previousContext = get(top)?.context ?? initialContext;
		const item = useComponentPage({
			...opts,
			previousContext,
			group: opts.group === 'top' ? get(top)?.group : opts.group
		});
		// _setTopFocus(false);
		items.update((prev) => [...prev, item]);
		item._setFocus(true);
		return item.id;
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

	// function _setTopFocus(value: boolean) {
	// 	get(top)?._setFocus(value);
	// }

	return {
		_items: items,
		_initialContext: initialContext,
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

// export const useComponentStack: typeof _useComponentStack = (...args) => {
// 	const componentStack = _useComponentStack(...args);
// 	setSvelteContext('component-stack', {
// 		componentStack,
// 		get page() {
// 			return get(componentStack._items)[0];
// 		}
// 	});

// 	return componentStack;
// };

export const componentStackContext = _createStoreContext(
	'component-stack',
	(componentStack: ComponentStackStore = useComponentStack(), page?: ComponentPage) => {
		const existing = getSvelteContext<ComponentStackStore>('component-stack');

		if (existing) {
			componentStack._initialContext = {
				...existing._initialContext,
				...componentStack._initialContext
			};
		}

		return {
			componentStack,
			page
		};
	},
	{
		required: true
	}
);

export function setContext<T>(key: string, value: T) {
	const { componentStack, page } = componentStackContext.getContext();

	if (!page) {
		componentStack._initialContext[key] = value;
		return;
	}

	return page.setContext<T>(key, value);
}

export function getContext<T>(key: string): T {
	const { componentStack, page } = componentStackContext.getContext();

	if (!page) {
		return componentStack._initialContext[key] as T;
	}

	return page.getContext<T>(key);
}

export function hasContext(key: string): boolean {
	const { componentStack, page } = componentStackContext.getContext();

	if (!page) {
		return key in componentStack._initialContext;
	}

	return page.hasContext(key);
}
