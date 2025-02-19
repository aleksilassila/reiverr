// export let name: string = '';
// export let direction: 'vertical' | 'horizontal' | 'grid' = 'vertical';
// export let gridCols: number = 0;
// export let focusOnMount = false;
// export let trapFocus = false;
// export let debugOutline = false;
// export let focusOnClick = false;
// export let focusedChild = false;

import type { SvelteHTMLElements } from 'svelte/elements';

// export let disabled = false;

export type ContainerProps = SvelteHTMLElements['div'] & {
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
};
