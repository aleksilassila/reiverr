import { getContext, hasContext, setContext } from 'svelte';
import { derived, writable } from 'svelte/store';

const VISIBILITY_CONTEXT_KEY = Symbol('UsersContext');

function useUiVisibilityStore() {
	const visible = writable(true);
	const visibleStyle = derived(
		visible,
		(v) => `transition: opacity 0.5s; ${v ? 'opacity: 1;' : 'opacity: 0;'}`
	);

	return {
		visible,
		visibleStyle: { subscribe: visibleStyle.subscribe }
	};
}

type UiVisibilityStore = ReturnType<typeof useUiVisibilityStore>;

export function setUiVisibilityContext() {
	const store = useUiVisibilityStore();
	setContext(VISIBILITY_CONTEXT_KEY, store);
	return store;
}

export function getUiVisibilityContext(): Partial<UiVisibilityStore> {
	if (hasContext(VISIBILITY_CONTEXT_KEY)) return getContext(VISIBILITY_CONTEXT_KEY);

	return {};
}
