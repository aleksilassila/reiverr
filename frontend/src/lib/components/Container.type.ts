import type { Selectable, SelectableConfig } from '$lib/selectable';
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

/** What the children snippet of a Container is given */
export type ContainerChildrenProps = {
	hasFocus: boolean;
	hasFocusWithin: boolean;
	focusIndex: number;
	selectable: Selectable;
};

export type ContainerProps = Omit<SvelteHTMLElements['div'], 'children'> &
	SelectableConfig & {
		/**
		 * The selectable the container drives; a parent that reads its stores creates it and passes it
		 * here. It lives as long as the container: a selectable is not given to a second container.
		 */
		selectable?: Selectable;
		focusOnMount?: boolean;
		focusOnClick?: boolean;
		/**
		 * The position of the container in a keyed list that can be reordered. The focus tree is put in
		 * order when a container mounts, and a reordered list only moves elements: a change of the index
		 * is what tells the container that it has moved.
		 */
		index?: number;
		tag?: string;
		/** Clicked with the mouse or selected with the d-pad */
		onClickOrSelect?: (selectable: Selectable) => void;
		/** The selectable is mounted in the focus tree */
		onMounted?: (selectable: Selectable) => void;
		children?: Snippet<[ContainerChildrenProps]>;
	};
