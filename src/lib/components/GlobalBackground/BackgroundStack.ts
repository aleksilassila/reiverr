import { Selectable, useRegistrar } from '$lib/selectable';
import { getContext, hasContext, onDestroy, setContext, type ComponentType } from 'svelte';
import { get, writable, type Writable } from 'svelte/store';

const BACKGROUND_CONTEXT_KEY = Symbol('BACKGROUND_CONTEXT_KEY');

export type Background = {
	id?: string;
	backdropUrl: string;
	videoUrl?: string;
	title?: string;
	subtitle?: string;
};

export type BackgroundPage = {
	id: symbol;
	mediaId: Writable<string | undefined>;
	isTransparent: Writable<boolean>;
	backgrounds: Writable<Background[]>;
	index: Writable<number>;
};

export const globalVideo = writable<
	{ component: ComponentType; props: Record<string, any> } | undefined
>(undefined);
export const globalBackgroundStack = writable<BackgroundPage[]>([]);
export const globalBackgroundRegistrar = useRegistrar();
let lastFocused: Selectable | undefined = undefined;

function _createBackgroundPage(
	options: {
		transparent?: boolean;
		mediaId?: string;
	} = {}
) {
	const { transparent = false, mediaId: initialMediaId } = options;

	const id = Symbol();
	const backgrounds = writable<Background[]>([]);
	const index = writable<number>(0);
	const isTransparent = writable(transparent);
	const mediaId = writable<string | undefined>(initialMediaId);
	const initialPage = {
		id,
		mediaId,
		backgrounds,
		index,
		isTransparent
	};
	globalBackgroundStack.update((pages) => [...pages, initialPage]);
	onDestroy(() => globalBackgroundStack.update((items) => items.filter((i) => i.id !== id)));

	function setBackgrounds(items: Background[]) {
		backgrounds.set(items);
	}

	function setIndex(i: number) {
		index.set(i);
	}

	function setMediaId(id: string) {
		mediaId.set(id);
	}

	return {
		setBackgrounds,
		setIndex,
		/** @deprecated */
		focus: focusGlobalBackground,
		setMediaId
	};
}
export const createBackgroundPage: typeof _createBackgroundPage = (...args) => {
	const page = _createBackgroundPage(...args);
	setContext(BACKGROUND_CONTEXT_KEY, page);
	return page;
};

export function getBackgroundPage() {
	if (hasContext(BACKGROUND_CONTEXT_KEY)) {
		return getContext<ReturnType<typeof _createBackgroundPage>>(BACKGROUND_CONTEXT_KEY);
	}

	return undefined;
}

export function focusGlobalBackground() {
	lastFocused = get(Selectable.focusedObject)?.getRootParent();
	const backgroundSelectable = get(globalBackgroundRegistrar);

	if (!lastFocused) {
		console.error('[Background Stack]: No focused object to return to');
		return;
	}

	if (!backgroundSelectable) {
		console.error('[Background Stack]: No background selectable registered');
		return;
	}

	backgroundSelectable.focus();
}

export function unfocusGlobalBackground() {
	if (lastFocused) {
		lastFocused.focus();
		lastFocused = undefined;
	} else {
		console.error('[Background Stack]: No focused object to return to');
	}
}

export function toggleFocusGlobalBackground() {
	if (lastFocused) {
		unfocusGlobalBackground();
	} else {
		focusGlobalBackground();
	}
}
