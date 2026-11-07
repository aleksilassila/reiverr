import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import { handleKeyboardNavigation, handleKeyboardNavigationKeyUp, Selectable } from './selectable';

/** The updates of Svelte and the removal of the unmounted containers, which waits for a microtask */
export async function settle() {
	await tick();
	await new Promise((resolve) => setTimeout(resolve));
}

/** The name of the focused container, which is also the element the browser has the focus on */
export function focused() {
	const selectable = get(Selectable.focusedObject);
	expect(document.activeElement).toBe(selectable?.getHtmlElement());
	return selectable?.name;
}

/** Presses a key on the focused element and returns the name of the container focused after it */
export function press(key: string) {
	const target = document.activeElement ?? document.body;
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
	return focused();
}

/** Called once by a spec file: the key listeners of App.svelte and a focus tree that starts empty */
export function setupFocusTree() {
	beforeAll(() => {
		window.addEventListener('keydown', handleKeyboardNavigation);
		window.addEventListener('keyup', handleKeyboardNavigationKeyUp);
	});

	beforeEach(async () => {
		// The containers of the previous test leave the tree a microtask after their unmount
		await settle();
		Selectable.focusedObject.set(undefined);
		vi.spyOn(console, 'warn');
	});

	afterEach(() => {
		// The warning of a mounting container whose sibling order was searched among detached elements
		const warnings = vi
			.mocked(console.warn)
			.mock.calls.filter(([message]) => message === "Couldn't find common parent element");
		vi.restoreAllMocks();
		expect(warnings).toEqual([]);
	});
}
