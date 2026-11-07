import type { IconComponent } from '$lib/components/icon.type';

export type CardBadge = {
	/** Absent for a mark that is its icon alone */
	label?: string;
	/** A small icon before the label */
	icon?: IconComponent;
	/** A red mark for something that is about to happen to the title */
	type?: 'default' | 'error';
};
