import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { takeFocusFromNext } from '../selectable';
import { focused, press, settle, setupFocusTree } from '../selectable.spec-utils';
import ContainerTree, { type TreeNode } from './ContainerTree.fixture.svelte';

async function mountTree(nodes: TreeNode[]) {
	const view = render(ContainerTree, { nodes });
	await settle();

	return {
		update: async (nodes: TreeNode[]) => {
			await view.rerender({ nodes });
			await settle();
		}
	};
}

const named = (...names: string[]): TreeNode[] => names.map((name) => ({ name }));

setupFocusTree();

describe('navigating', () => {
	it('focuses the first container of a mounted page', async () => {
		await mountTree([{ name: 'page', children: named('a', 'b') }]);

		expect(focused()).toBe('a');
	});

	it('moves along a vertical container with up and down and stops at its ends', async () => {
		await mountTree([{ name: 'page', children: named('a', 'b', 'c') }]);

		expect(press('ArrowDown')).toBe('b');
		expect(press('ArrowRight')).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowUp')).toBe('a');
		expect(press('ArrowUp')).toBe('a');
	});

	it('leaves a horizontal container with up and down and returns to the child it left', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'top', direction: 'horizontal', children: named('a', 'b', 'c') },
					{ name: 'bottom', direction: 'horizontal', children: named('d', 'e') }
				]
			}
		]);

		expect(press('ArrowRight')).toBe('b');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowRight')).toBe('e');
		expect(press('ArrowRight')).toBe('e');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowLeft')).toBe('a');
	});

	it('moves in a grid by its columns', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{
						name: 'grid',
						direction: 'grid',
						gridCols: 3,
						children: named('1', '2', '3', '4', '5', '6', '7')
					}
				]
			}
		]);

		expect(press('ArrowRight')).toBe('2');
		expect(press('ArrowDown')).toBe('5');
		expect(press('ArrowRight')).toBe('6');
		// The end of a row
		expect(press('ArrowRight')).toBe('6');
		// The last row is short: down goes to its last container
		expect(press('ArrowDown')).toBe('7');
		expect(press('ArrowUp')).toBe('4');
		expect(press('ArrowLeft')).toBe('4');
		expect(press('ArrowUp')).toBe('1');
	});

	it('skips a disabled container', async () => {
		await mountTree([
			{ name: 'page', children: [{ name: 'a' }, { name: 'b', disabled: true }, { name: 'c' }] }
		]);

		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowUp')).toBe('a');
	});

	it('keeps the focus inside a container that traps it', async () => {
		await mountTree([
			{
				name: 'page',
				children: [{ name: 'dialog', trapFocus: true, children: named('a', 'b') }, { name: 'c' }]
			}
		]);

		expect(press('ArrowDown')).toBe('b');
		expect(press('ArrowDown')).toBe('b');
	});

	it('lets onNavigate prevent the navigation', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a', onNavigate: (e) => e.direction === 'down' && e.preventNavigation() },
					{ name: 'b' }
				]
			}
		]);

		expect(press('ArrowDown')).toBe('a');
	});

	it('calls onEnter when the focus enters a container, not when it moves inside it', async () => {
		const onEnterRow = vi.fn();
		const onEnterB = vi.fn();
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a' },
					{
						name: 'row',
						direction: 'horizontal',
						onEnter: onEnterRow,
						children: [{ name: 'b', onEnter: onEnterB }, { name: 'c' }]
					}
				]
			}
		]);

		expect(press('ArrowDown')).toBe('b');
		expect(press('ArrowRight')).toBe('c');

		expect(onEnterRow).toHaveBeenCalledTimes(1);
		expect(onEnterB).toHaveBeenCalledTimes(1);
	});

	it('selects the focused container with enter', async () => {
		const onSelect = vi.fn();
		const onClickOrSelect = vi.fn();
		await mountTree([
			{ name: 'page', children: [{ name: 'a' }, { name: 'b', onSelect, onClickOrSelect }] }
		]);

		press('Enter');
		expect(onSelect).not.toHaveBeenCalled();

		press('ArrowDown');
		press('Enter');
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onClickOrSelect).toHaveBeenCalledTimes(1);
	});

	it('focuses a clicked container that has focusOnClick', async () => {
		const onClickOrSelect = vi.fn();
		await mountTree([
			{
				name: 'page',
				children: [{ name: 'a' }, { name: 'b', focusOnClick: true, onClickOrSelect }]
			}
		]);

		document.querySelector<HTMLElement>('[data-testid="b"]')?.click();

		expect(focused()).toBe('b');
		expect(onClickOrSelect).toHaveBeenCalledTimes(1);
	});

	it('sends back up the tree until a container stops it', async () => {
		const onBackPage = vi.fn();
		const onBackA = vi.fn();
		await mountTree([
			{
				name: 'page',
				onBack: onBackPage,
				children: [
					{
						name: 'dialog',
						onBack: (e) => e.stopPropagation(),
						children: [{ name: 'a', onBack: onBackA }]
					}
				]
			}
		]);

		press('Escape');

		expect(onBackA).toHaveBeenCalledTimes(1);
		expect(onBackPage).not.toHaveBeenCalled();
	});
});

describe('mounting', () => {
	it('gives the focus to a container mounted with focusOnMount', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'b') }]);

		await tree.update([
			{ name: 'page', children: [{ name: 'a' }, { name: 'b' }, { name: 'c', focusOnMount: true }] }
		]);

		expect(focused()).toBe('c');
	});

	it('leaves the focus where it is when containers are mounted around it', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'c') }]);
		expect(press('ArrowDown')).toBe('c');

		await tree.update([{ name: 'page', children: named('a', 'b', 'c', 'd') }]);

		expect(focused()).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowDown')).toBe('d');
	});

	it('keeps the focus on the first container when one is mounted before it', async () => {
		const tree = await mountTree([{ name: 'page', children: named('b', 'c') }]);

		await tree.update([{ name: 'page', children: named('a', 'b', 'c') }]);

		expect(focused()).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowUp')).toBe('a');
	});

	it('enters a container that has not had the focus at a container mounted first in it', async () => {
		const page = (...names: string[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'filters' }, { name: 'list', children: named(...names) }] }
		];
		const tree = await mountTree(page('b', 'c'));

		await tree.update(page('a', 'b', 'c'));

		expect(focused()).toBe('filters');
		expect(press('ArrowDown')).toBe('a');
	});

	// The Play button of the movie page, mounted when the status arrives
	describe('with takeFocusFromNext', () => {
		const row = (...children: TreeNode[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'row', direction: 'horizontal', children }] }
		];
		const play: TreeNode = { name: 'play', onMounted: takeFocusFromNext };

		it('gives the focus to a container mounted before the focused one', async () => {
			const tree = await mountTree(row(...named('request', 'more')));

			await tree.update(row(play, ...named('request', 'more')));

			expect(focused()).toBe('play');
			expect(press('ArrowRight')).toBe('request');
			expect(press('ArrowLeft')).toBe('play');
		});

		it('leaves the focus where it has moved on to', async () => {
			const tree = await mountTree(row(...named('request', 'more')));
			expect(press('ArrowRight')).toBe('more');

			await tree.update(row(play, ...named('request', 'more')));

			expect(focused()).toBe('more');
			expect(press('ArrowLeft')).toBe('request');
			expect(press('ArrowLeft')).toBe('play');
		});

		it('does nothing when it is mounted together with the row', async () => {
			await mountTree(row(...named('first'), play, ...named('request')));

			expect(focused()).toBe('first');
			expect(press('ArrowRight')).toBe('play');
		});
	});

	it('enters a container at the child mounted with focusedChild', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a' },
					{ name: 'list', children: [{ name: 'b' }, { name: 'c', focusedChild: true }] }
				]
			}
		]);

		expect(focused()).toBe('a');
		expect(press('ArrowDown')).toBe('c');
	});

	it('gives the focus to the first container mounted in an empty focused container', async () => {
		const tree = await mountTree([{ name: 'page', children: [{ name: 'list' }] }]);
		expect(focused()).toBe('list');

		await tree.update([{ name: 'page', children: [{ name: 'list', children: named('a', 'b') }] }]);

		expect(focused()).toBe('a');
		expect(press('ArrowDown')).toBe('b');
	});

	it('gives the focus to a page mounted on top of another', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'b') }]);

		await tree.update([
			{ name: 'page', children: named('a', 'b') },
			{ name: 'dialog', children: named('c', 'd') }
		]);

		expect(focused()).toBe('c');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowUp')).toBe('c');
		expect(press('ArrowUp')).toBe('c');
	});
});

describe('unmounting', () => {
	it('gives the focus of an unmounted container to the one that takes its place', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'b', 'c') }]);
		expect(press('ArrowDown')).toBe('b');

		await tree.update([{ name: 'page', children: named('a', 'c') }]);
		expect(focused()).toBe('c');

		await tree.update([{ name: 'page', children: named('a') }]);
		expect(focused()).toBe('a');
	});

	it('leaves the focus where it is when containers around it are unmounted', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'b', 'c', 'd', 'e') }]);
		press('ArrowDown');
		press('ArrowDown');
		expect(focused()).toBe('c');

		await tree.update([{ name: 'page', children: named('b', 'c', 'd') }]);

		expect(focused()).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowDown')).toBe('d');
	});

	it('keeps the focus when a container is mounted before it and another unmounted after it', async () => {
		const tree = await mountTree([{ name: 'page', children: named('b', 'c', 'd') }]);

		await tree.update([{ name: 'page', children: named('a', 'b', 'c', 'd') }]);
		await tree.update([{ name: 'page', children: named('a', 'b', 'c') }]);

		expect(focused()).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowUp')).toBe('a');
	});

	it('keeps the focus further down when a container is mounted before it and another unmounted after it', async () => {
		const tree = await mountTree([{ name: 'page', children: named('a', 'c', 'd', 'e') }]);
		expect(press('ArrowDown')).toBe('c');

		await tree.update([{ name: 'page', children: named('a', 'b', 'c', 'd', 'e') }]);
		await tree.update([{ name: 'page', children: named('a', 'b', 'c', 'd') }]);

		expect(focused()).toBe('c');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowUp')).toBe('c');
		expect(press('ArrowUp')).toBe('b');
	});

	it('keeps the focus when the rows of a list mounted empty come and go', async () => {
		const list = (...names: string[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'list', children: named(...names) }] }
		];
		const tree = await mountTree(list());
		await tree.update(list('a', 'b', 'c', 'd'));
		expect(press('ArrowDown')).toBe('b');

		await tree.update(list('a', 'b', 'c'));
		expect(focused()).toBe('b');
		expect(press('ArrowDown')).toBe('c');

		await tree.update(list('b', 'c'));
		expect(focused()).toBe('c');
		expect(press('ArrowUp')).toBe('b');
	});

	// The my list button of a title page: one button replaced by another in the same update
	it('gives the focus of a container swapped for another to the replacement', async () => {
		const row = (...names: string[]): TreeNode[] => [
			{
				name: 'page',
				children: [{ name: 'row', direction: 'horizontal', children: named(...names) }]
			}
		];
		const tree = await mountTree(row('play', 'add', 'more'));
		expect(press('ArrowRight')).toBe('add');

		await tree.update(row('play', 'remove', 'more'));

		expect(focused()).toBe('remove');
		expect(press('ArrowLeft')).toBe('play');
		expect(press('ArrowRight')).toBe('remove');
		expect(press('ArrowRight')).toBe('more');
	});

	it('gives the focus of the first container swapped for another to the replacement', async () => {
		const row = (...names: string[]): TreeNode[] => [
			{
				name: 'page',
				children: [{ name: 'row', direction: 'horizontal', children: named(...names) }]
			}
		];
		const tree = await mountTree(row('add', 'more'));

		await tree.update(row('remove', 'more'));

		expect(focused()).toBe('remove');
		expect(press('ArrowRight')).toBe('more');
		expect(press('ArrowLeft')).toBe('remove');
	});

	it('gives the focus within an unmounted container to the next one', async () => {
		const tree = await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'first', children: named('a', 'b') },
					{ name: 'second', children: named('c', 'd') }
				]
			}
		]);
		expect(press('ArrowDown')).toBe('b');

		await tree.update([
			{ name: 'page', children: [{ name: 'second', children: named('c', 'd') }] }
		]);

		expect(focused()).toBe('c');
		expect(press('ArrowDown')).toBe('d');
	});

	it('keeps the focus in a list whose containers are all replaced', async () => {
		const list = (...names: string[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'list', children: named(...names) }, { name: 'below' }] }
		];
		const tree = await mountTree(list('a', 'b', 'c'));
		expect(press('ArrowDown')).toBe('b');

		await tree.update(list('d', 'e', 'f'));

		expect(focused()).toBe('e');
		expect(press('ArrowUp')).toBe('d');
		expect(press('ArrowDown')).toBe('e');
		expect(press('ArrowDown')).toBe('f');
		expect(press('ArrowDown')).toBe('below');
	});

	it('keeps the focus at the top of a list replaced while its first container has the focus', async () => {
		const list = (...names: string[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'list', children: named(...names) }, { name: 'below' }] }
		];
		const tree = await mountTree(list('a', 'b'));

		await tree.update(list('c', 'd'));

		expect(focused()).toBe('c');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowDown')).toBe('below');
	});

	it('leaves the focus on a container whose last child is unmounted', async () => {
		const list = (...names: string[]): TreeNode[] => [
			{ name: 'page', children: [{ name: 'list', children: named(...names) }] }
		];
		const tree = await mountTree(list('a'));

		await tree.update(list());
		expect(focused()).toBe('list');

		await tree.update(list('b', 'c'));
		expect(focused()).toBe('b');
		expect(press('ArrowDown')).toBe('c');
	});

	// A page that closes: the focus goes back to where it was on the page underneath
	it('returns the focus to the page under an unmounted one', async () => {
		const page: TreeNode = { name: 'page', children: named('a', 'b', 'c') };
		const tree = await mountTree([page]);
		expect(press('ArrowDown')).toBe('b');

		await tree.update([page, { name: 'dialog', children: named('d', 'e') }]);
		expect(press('ArrowDown')).toBe('e');

		await tree.update([page]);

		expect(focused()).toBe('b');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowUp')).toBe('b');
		expect(press('ArrowUp')).toBe('a');
	});
});
