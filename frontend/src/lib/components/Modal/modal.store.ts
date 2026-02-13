import type { ComponentType, SvelteComponentTyped } from 'svelte';
import { stackRouter } from '../StackRouter/stack-router.store';
import { writable } from 'svelte/store';
import { subscribe } from 'svelte/internal';

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

export type SimpleModalStack = ReturnType<typeof useSimpleModal>;

export function useSimpleModal() {
	const modal = writable<{
		component: ComponentType<SvelteComponentTyped<Record<string, unknown>>>;
		props: Record<string, unknown>;
	} | null>(null);

	function createModal<T extends Record<string, unknown>>(
		component: ComponentType<SvelteComponentTyped<T>>,
		props: T
	) {
		modal.set({
			component,
			props
		});
	}

	return {
		subscribe: modal.subscribe,
		current: modal,
		createModal
	};
}
