import type { EnterEvent, KeyEvent, NavigateEvent, Selectable } from '$lib/selectable';
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

/** What the children snippet of a Container is given */
export type ContainerChildrenProps = {
	hasFocus: boolean;
	hasFocusWithin: boolean;
	focusIndex: number;
	selectable: Selectable;
};

export type ContainerProps = Omit<SvelteHTMLElements['div'], 'children'> & {
	/** The selectable the container drives; a parent that reads its stores creates it and passes it here */
	selectable?: Selectable;
	name?: string;
	direction?: 'vertical' | 'horizontal' | 'grid';
	gridCols?: number;
	focusOnMount?: boolean;
	trapFocus?: boolean;
	debugOutline?: boolean;
	focusOnClick?: boolean;
	focusedChild?: boolean;
	disabled?: boolean;
	tag?: string;
	index?: number | undefined;
	/** Called when enter is held down, instead of select */
	onLongPress?: () => void;
	/** The container or something in it got the focus */
	onEnter?: (e: EnterEvent) => void;
	onNavigate?: (e: NavigateEvent) => void;
	/** Selected with the d-pad */
	onSelect?: () => void;
	/** Clicked with the mouse or selected with the d-pad */
	onClickOrSelect?: (selectable: Selectable) => void;
	onBack?: (e: KeyEvent) => void;
	onPlayPause?: (e: KeyEvent) => void;
	/** The selectable is mounted in the focus tree */
	onMounted?: (selectable: Selectable) => void;
	/** The focus left the container */
	onBlur?: (selectable: Selectable) => void;
	children?: Snippet<[ContainerChildrenProps]>;
};
