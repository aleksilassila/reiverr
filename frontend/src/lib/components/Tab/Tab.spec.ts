import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { focused, press, settle, setupFocusTree } from '../../selectable.spec-utils';
import { useTabs } from './Tab';
import Tabs from './Tabs.fixture.svelte';

setupFocusTree();

// The profile editor: both tabs stay mounted and the pictures tab opens on the current picture
describe('tabs that stay mounted', () => {
	async function mountTabs() {
		const tab = useTabs(0, { remount: false });
		render(Tabs, { tab });
		await settle();
		return tab;
	}

	it('have the focus in the open tab after mounting', async () => {
		await mountTabs();

		expect(focused()).toBe('first-a');
	});

	it('keep the focus out of a closed tab', async () => {
		await mountTabs();

		expect(press('ArrowDown')).toBe('first-b');
		expect(press('ArrowDown')).toBe('first-b');
	});

	it('open a tab on its focused child and return to where the focus was', async () => {
		const tab = await mountTabs();
		press('ArrowDown');

		tab.set(1);
		await settle();
		expect(focused()).toBe('second-b');
		expect(press('ArrowUp')).toBe('second-a');

		tab.set(0);
		await settle();
		expect(focused()).toBe('first-b');
	});
});

describe('tabs that mount when they open', () => {
	it('move the focus to the tab that opens', async () => {
		const tab = useTabs(0);
		render(Tabs, { tab });
		await settle();
		expect(focused()).toBe('first-a');

		tab.set(1);
		await settle();
		expect(focused()).toBe('second-b');
		expect(press('ArrowUp')).toBe('second-a');

		tab.set(0);
		await settle();
		expect(focused()).toBe('first-a');
		expect(press('ArrowDown')).toBe('first-b');
	});
});
