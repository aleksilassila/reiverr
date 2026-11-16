import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import { Selectable, takeFocusFromNext } from '../selectable';
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

function selectableOf(name: string): Selectable {
	const element = document.querySelector<HTMLElement>(`[data-testid="${name}"]`);
	const selectable = element && Selectable.objects.get(element);
	if (!selectable) throw new Error(`No container named ${name}`);
	return selectable;
}

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

	it('says whether a container took the focus, which a disabled one does not', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a' },
					{ name: 'b', disabled: true },
					{ name: 'list', disabled: true, children: named('c') },
					{ name: 'row', children: [{ name: 'd', disabled: true }, { name: 'e' }] }
				]
			}
		]);

		expect(selectableOf('b').focus()).toBe(false);
		expect(selectableOf('list').focus()).toBe(false);
		expect(focused()).toBe('a');

		expect(selectableOf('row').focus()).toBe(true);
		expect(focused()).toBe('e');
		expect(selectableOf('row').focus()).toBe(true);
		expect(focused()).toBe('e');
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

	it('calls onBlur when the focus has left a container, whichever way, not when it moves inside it', async () => {
		const hadFocusWithin = vi.fn();
		const onBlur = (row: Selectable) => hadFocusWithin(get(row.hasFocusWithin));
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'row', direction: 'horizontal', onBlur, children: named('a', 'b') },
					{ name: 'c', focusOnClick: true }
				]
			}
		]);

		expect(press('ArrowRight')).toBe('b');
		expect(hadFocusWithin).not.toHaveBeenCalled();

		expect(press('ArrowDown')).toBe('c');
		expect(hadFocusWithin).toHaveBeenCalledTimes(1);
		expect(hadFocusWithin).toHaveBeenLastCalledWith(false);

		expect(press('ArrowUp')).toBe('b');
		selectableOf('c').focus();
		expect(hadFocusWithin).toHaveBeenCalledTimes(2);

		expect(press('ArrowUp')).toBe('b');
		document.querySelector<HTMLElement>('[data-testid="c"]')?.click();
		expect(focused()).toBe('c');
		expect(hadFocusWithin).toHaveBeenCalledTimes(3);
	});

	it('does not call onBlur when the navigation out of a container is prevented', async () => {
		const onBlur = vi.fn();
		await mountTree([
			{
				name: 'page',
				onNavigate: (e) => e.preventNavigation(),
				children: [{ name: 'row', onBlur, children: named('a') }, { name: 'b' }]
			}
		]);

		expect(press('ArrowDown')).toBe('a');
		expect(onBlur).not.toHaveBeenCalled();
	});

	// A tab bar: the focus moves between its items and comes back to the open one
	it('enters a container again at the child activated when the focus left it', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{
						name: 'bar',
						direction: 'horizontal',
						onBlur: (bar) => bar.setFocusIndex(0),
						children: named('a', 'b', 'c')
					},
					{ name: 'd' }
				]
			}
		]);

		press('ArrowRight');
		expect(press('ArrowRight')).toBe('c');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowUp')).toBe('a');
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
		expect(onSelect).toHaveBeenCalledWith(get(Selectable.focusedObject));
		expect(onClickOrSelect).toHaveBeenCalledTimes(1);
	});

	// A checkbox: the container is what the tree focuses, the input what the browser does
	it('gives the focus of the browser to the element onEnter names', async () => {
		const input = document.createElement('input');
		document.body.append(input);
		await mountTree([
			{
				name: 'page',
				children: [{ name: 'a' }, { name: 'b', onEnter: (e) => e.focusElement(input) }]
			}
		]);

		document.activeElement?.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
		);

		expect(get(Selectable.focusedObject)?.name).toBe('b');
		expect(document.activeElement).toBe(input);
		input.remove();
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

describe('setting the focus index', () => {
	const page: TreeNode[] = [
		{
			name: 'page',
			children: [
				{ name: 'a' },
				{ name: 'group', children: [{ name: 'b' }, { name: 'list', children: named('c', 'd') }] }
			]
		}
	];

	it('enters the container at the child of the index, and leaves the focus where it is', async () => {
		await mountTree(page);
		press('ArrowDown');
		expect(press('ArrowDown')).toBe('c');
		press('ArrowUp');
		expect(press('ArrowUp')).toBe('a');

		selectableOf('list').setFocusIndex(1);
		expect(focused()).toBe('a');
		expect(press('ArrowDown')).toBe('b');
		expect(press('ArrowDown')).toBe('d');
	});

	it('leaves the containers above as they are entered', async () => {
		await mountTree(page);

		selectableOf('list').setFocusIndex(1);
		expect(press('ArrowDown')).toBe('b');
	});

	it('gives the focus to the child of the index in a container that has the focus', async () => {
		await mountTree(page);
		press('ArrowDown');
		expect(press('ArrowDown')).toBe('c');

		selectableOf('list').setFocusIndex(1);
		expect(focused()).toBe('d');
	});

	it('does nothing for an index without a child', async () => {
		await mountTree(page);
		press('ArrowDown');
		expect(press('ArrowDown')).toBe('c');
		expect(press('ArrowDown')).toBe('d');

		selectableOf('list').setFocusIndex(-1);
		selectableOf('list').setFocusIndex(2);
		expect(focused()).toBe('d');
	});

	it('is set by a child that activates itself', async () => {
		await mountTree(page);

		selectableOf('d').activate();
		expect(focused()).toBe('a');
		press('ArrowDown');
		expect(press('ArrowDown')).toBe('d');
	});
});

describe('mounting', () => {
	// A container attaches in the action of its element, which has to run before the actions of the
	// containers inside it. Svelte does that for a svelte:element; were it to stop, or Container to
	// render a plain element, every container would be a root
	it('attaches a container to the container around it, in the order of the document', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'row', direction: 'horizontal', children: named('a', 'b') },
					{ name: 'c' }
				]
			}
		]);

		const a = get(Selectable.focusedObject);
		const row = a?.getParent();
		const page = row?.getParent();

		expect(a?.name).toBe('a');
		expect(row?.getChildren().map((child) => child.name)).toEqual(['a', 'b']);
		expect(page?.getChildren().map((child) => child.name)).toEqual(['row', 'c']);
		expect(page?.getParent()).toBeUndefined();
	});

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

	it('enters a container at the child mounted with defaultFocus', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a' },
					{ name: 'list', children: [{ name: 'b' }, { name: 'c', defaultFocus: true }] }
				]
			}
		]);

		expect(focused()).toBe('a');
		expect(press('ArrowDown')).toBe('c');
	});

	// The default button of a dialog, in a row of buttons under its fields
	it('enters every container above the child mounted with defaultFocus at it', async () => {
		await mountTree([
			{
				name: 'page',
				children: [
					{ name: 'a' },
					{
						name: 'dialog',
						children: [
							{ name: 'fields', children: named('b', 'c') },
							{
								name: 'buttons',
								direction: 'horizontal',
								children: [{ name: 'cancel' }, { name: 'save', defaultFocus: true }]
							}
						]
					}
				]
			}
		]);

		expect(focused()).toBe('a');
		expect(press('ArrowDown')).toBe('save');
	});

	it('leaves the focus where it is when a container is mounted with defaultFocus', async () => {
		const list = (...children: TreeNode[]): TreeNode[] => [{ name: 'list', children }];
		const tree = await mountTree(list(...named('a', 'b')));

		await tree.update(list(...named('a', 'b'), { name: 'c', defaultFocus: true }));

		expect(focused()).toBe('a');
	});

	it('enters a container that was left at another child at the first one mounted with defaultFocus', async () => {
		const page = (...list: TreeNode[]): TreeNode[] => [
			{
				name: 'page',
				direction: 'horizontal',
				children: [{ name: 'a' }, { name: 'list', children: list }]
			}
		];
		const tree = await mountTree(page(...named('c', 'd')));
		press('ArrowRight');
		expect(press('ArrowDown')).toBe('d');
		expect(press('ArrowLeft')).toBe('a');

		await tree.update(page({ name: 'b', defaultFocus: true }, ...named('c', 'd')));

		expect(focused()).toBe('a');
		expect(press('ArrowRight')).toBe('b');
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

describe('updating', () => {
	it('follows the props of its container', async () => {
		const page = (props: Partial<TreeNode>): TreeNode[] => [
			{ name: 'page', children: [{ name: 'list', ...props, children: named('a', 'b', 'c') }] }
		];
		const tree = await mountTree(page({ direction: 'vertical' }));
		expect(press('ArrowRight')).toBe('a');

		await tree.update(page({ direction: 'horizontal' }));
		expect(press('ArrowRight')).toBe('b');

		await tree.update(page({ direction: 'horizontal', disabled: true }));
		expect(get(Selectable.focusedObject)?.getParent()?.focus()).toBe(false);
	});

	// A reordered keyed list moves the elements of its items without mounting anything; the index of
	// the items is how their containers know
	describe('a keyed list whose containers have an index', () => {
		const list = (...names: string[]): TreeNode[] => [
			{
				name: 'page',
				children: [
					{
						name: 'list',
						direction: 'horizontal',
						children: names.map((name, index) => ({ name, index }))
					}
				]
			}
		];

		it('keeps the order of the document and the focus when it is reordered', async () => {
			const tree = await mountTree(list('a', 'b', 'c', 'd'));
			expect(press('ArrowRight')).toBe('b');

			await tree.update(list('c', 'a', 'd', 'b'));

			// Not `focused()`: the browser takes its focus from an element that is moved, until the next
			// move of the focus
			expect(get(Selectable.focusedObject)?.name).toBe('b');
			expect(press('ArrowLeft')).toBe('d');
			expect(press('ArrowLeft')).toBe('a');
			expect(press('ArrowLeft')).toBe('c');
			expect(press('ArrowRight')).toBe('a');
		});

		it('keeps the order of the document when a container is mounted in it', async () => {
			const tree = await mountTree(list('a', 'b', 'c', 'd'));

			await tree.update(list('x', 'a', 'b', 'y', 'c', 'd'));

			expect(focused()).toBe('a');
			expect(press('ArrowLeft')).toBe('x');
			expect(press('ArrowRight')).toBe('a');
			expect(press('ArrowRight')).toBe('b');
			expect(press('ArrowRight')).toBe('y');
			expect(press('ArrowRight')).toBe('c');
			expect(press('ArrowRight')).toBe('d');
		});

		it('is entered at its first container while it has not had the focus', async () => {
			const page = (...names: string[]): TreeNode[] => [
				{ name: 'page', children: [{ name: 'top' }, ...(list(...names)[0]?.children ?? [])] }
			];
			const tree = await mountTree(page('a', 'b', 'c'));

			await tree.update(page('c', 'a', 'b'));

			expect(focused()).toBe('top');
			expect(press('ArrowDown')).toBe('c');
		});
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
