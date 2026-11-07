import type { Component } from 'svelte';
import { stackRouter } from '../StackRouter/stack-router.store';
import { writable } from 'svelte/store';

export const createModal = <T extends Record<string, any>>(
	component: Component<T>,
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
	// The props type is erased: the pair was checked where the modal was created
	const modal = writable<{
		component: Component<any>;
		props: Record<string, unknown>;
	} | null>(null);

	function createModal<T extends Record<string, any>>(component: Component<T>, props: T) {
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
