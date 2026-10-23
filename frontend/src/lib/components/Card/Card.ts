import type { ComponentType } from 'svelte';

export type CardBadge = {
	label: string;
	/** A small icon before the label */
	icon?: ComponentType;
	/** A red mark for something that is about to happen to the title */
	type?: 'default' | 'error';
};
