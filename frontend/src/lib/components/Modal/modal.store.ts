import type { ComponentType, SvelteComponentTyped } from 'svelte';
import { stackRouter } from '../StackRouter/stack-router.store';

export const createModal = <T extends Record<string, unknown>>(
	component: ComponentType<SvelteComponentTyped<T>>,
	props: T,
	group?: symbol | 'top'
) => {
	return stackRouter.push({
		component,
		props,
		group
	});
};
