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
		/**
		 * The container takes the focus when it mounts, from wherever the focus is, unless it has it
		 * already: a page, a dialog or a sheet that opens, or content that arrives after its page and is
		 * what the page is for. Read at the mount only.
		 */
		focusOnMount?: boolean;
		/**
		 * The focus starts here when it comes to the containers above: at the mount the container becomes
		 * what its parent is entered at, the parent what its own parent is entered at, and so on up to
		 * the first container that has the focus. The focus itself stays where it is. Read at the mount
		 * only; the parent's `setFocusIndex()` is for what follows a value afterwards.
		 */
		defaultFocus?: boolean;
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
