import { Selectable, useRegistrar } from '$lib/selectable';
import { get } from 'svelte/store';

export const sidebarRegistrar = useRegistrar();

let lastFocused: Selectable | undefined = undefined;
export function focusSidebar() {
	lastFocused = get(Selectable.focusedObject)?.getRootParent();
	const sidebarSelectable = get(sidebarRegistrar);

	if (!lastFocused) {
		console.error('[Sidebar Stack]: No focused object to return to');
		return;
	}

	if (!sidebarSelectable) {
		console.error('[Sidebar Stack]: No sidebar selectable registered');
		return;
	}

	sidebarSelectable.focus();
}

export function unfocusSidebar() {
	if (lastFocused) {
		lastFocused.focus();
	} else {
		console.error('[Sidebar Stack]: No focused object to return to');
	}
}
