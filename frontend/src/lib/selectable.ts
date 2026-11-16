import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { type Offsets, scrollElementIntoView } from './scroll-into-view';

export type Direction = 'up' | 'down' | 'left' | 'right';
type FlowDirection = 'vertical' | 'horizontal';

/** An event that goes up the tree, from the focused selectable to the root, until a handler stops it */
type PropagatingEvent = {
	/** The selectable whose handler is called */
	selectable: Selectable;
	/** Keeps the event from the selectables above */
	stopPropagation: () => void;
};

export type EnterEvent = PropagatingEvent & {
	/** The element the browser focuses in place of the focused selectable's own */
	focusElement: (element: HTMLElement) => void;
};

export type NavigateEvent = PropagatingEvent & {
	direction: Direction;
	/** Whether the focus leaves the selectable whose handler is called */
	willLeaveContainer: boolean;
	preventNavigation: () => void;
};

export type KeyEvent = PropagatingEvent;

/**
 * What a Container tells its selectable, under the names of the Container's props. The handlers of
 * the events that go up the tree get the event, the others the selectable.
 */
export type SelectableConfig = {
	name?: string;
	direction?: FlowDirection | 'grid';
	gridCols?: number;
	trapFocus?: boolean;
	/**
	 * Disabled selectable won't receive focus. Use to make hidden elements
	 * uninteractable without unmounting them, for example
	 */
	disabled?: boolean;
	/** The selectable or something in it got the focus */
	onEnter?: (e: EnterEvent) => void;
	/** The d-pad moves the focus from the selectable or from something in it */
	onNavigate?: (e: NavigateEvent) => void;
	/**
	 * The focus has left the selectable, whichever way: it or something in it had the focus, and what
	 * has it now is outside. Called after the focus has moved
	 */
	onBlur?: (selectable: Selectable) => void;
	/** Selected with the d-pad */
	onSelect?: (selectable: Selectable) => void;
	/** Called when enter is held down, instead of select */
	onLongPress?: (selectable: Selectable) => void;
	onBack?: (e: KeyEvent) => void;
};

/**
 * Whether the focus follows the mouse: on from a mouse button or the wheel, off from the arrow keys.
 * The scroll into view on focus is skipped while it is on, so that the focus a closed sheet or
 * dialog gives back does not scroll the page away from where the mouse left it.
 * Not `inputMode`: that goes back to keyboard mode on Enter and Back, which here would scroll
 * when a sheet opened with a click is closed with Back.
 */
export let mouseMode = true;
export function setMouseMode(next: boolean) {
	mouseMode = next;
}

export class Selectable {
	name: string;
	private parent?: Selectable;
	private children: Selectable[] = [];
	private htmlElement?: HTMLElement;

	private trapFocus: boolean = false;
	private disabled: boolean = true;

	private onEnter: SelectableConfig['onEnter'];
	private onNavigate: SelectableConfig['onNavigate'];
	private onBlur: SelectableConfig['onBlur'];
	private onSelect: SelectableConfig['onSelect'];
	private onLongPress: SelectableConfig['onLongPress'];
	private onBack: SelectableConfig['onBack'];

	private direction: FlowDirection = 'vertical';
	private gridColumns: number = 0;
	private _removedChildrenCount: number = 0;
	private _addChildCount = 0;

	private static _childrenToRemove: Selectable[] = [];

	static focusedObject: Writable<Selectable | undefined> = writable(undefined);

	private _focusIndex: Writable<number> = writable(0);
	/**
	 * The index of the child the selectable is entered at: the child that has the focus, or the one
	 * that gets it when the selectable does. Written by {@link focus} and {@link setFocusIndex}
	 */
	focusIndex: Readable<number> = this._focusIndex;
	hasFocus: Readable<boolean> = derived(Selectable.focusedObject, ($focusedObject) => {
		return $focusedObject === this;
	});
	hasFocusWithin: Readable<boolean> = derived(Selectable.focusedObject, ($focusedObject) => {
		let currentSelectable: Selectable | undefined = $focusedObject;

		while (currentSelectable) {
			if (currentSelectable === this) {
				return true;
			}
			currentSelectable = currentSelectable.parent;
		}

		return false;
	});

	didUnmount = false;

	static objects = new Map<HTMLElement, Selectable>();
	static rootObjectsStack: Selectable[] = [];

	constructor(name: string = '') {
		this.name = name;
	}

	/**
	 * Called by the Container that drives the selectable, with all of its props at once: what is left
	 * out goes back to its default. A selectable is disabled until its Container configures it.
	 */
	configure(config: SelectableConfig) {
		this.name = config.name || this.name;
		this.direction = config.direction === 'grid' ? 'horizontal' : (config.direction ?? 'vertical');
		this.gridColumns = config.gridCols ?? 0;
		this.trapFocus = config.trapFocus ?? false;
		this.disabled = config.disabled ?? false;
		this.onEnter = config.onEnter;
		this.onNavigate = config.onNavigate;
		this.onBlur = config.onBlur;
		this.onSelect = config.onSelect;
		this.onLongPress = config.onLongPress;
		this.onBack = config.onBack;
	}

	/**
	 * Called when the element of the selectable may have moved among its siblings without mounting, as
	 * the items of a keyed list do when the list is reordered. The selectables of the parent take the
	 * order of the document again, and the focus index stays on the child it was on.
	 */
	sortSiblings() {
		const parent = this.parent;
		if (!parent) return;

		const follows = (a: Selectable, b: Selectable) => {
			if (!a.htmlElement || !b.htmlElement) return false;
			const position = b.htmlElement.compareDocumentPosition(a.htmlElement);
			return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
		};

		// A selectable on its way out keeps its place until the teardown ends: its element is detached
		const mounted = parent.children.filter((child) => !child.didUnmount);
		if (!mounted.some((child, index) => index > 0 && follows(mounted[index - 1]!, child))) return;

		const focusIndex = get(parent.focusIndex);
		const focusedChild = parent.children[focusIndex];
		// A container that has not had the focus yet is still entered at its first child
		const followFocusedChild = focusIndex > 0 || (focusedChild && get(focusedChild.hasFocusWithin));

		mounted.sort((a, b) => (follows(a, b) ? 1 : -1));
		let next = 0;
		parent.children = parent.children.map((child) => (child.didUnmount ? child : mounted[next++]!));

		if (focusedChild && followFocusedChild)
			parent._focusIndex.set(parent.children.indexOf(focusedChild));
	}

	/**
	 * Takes the focus, from wherever it is: the child the selectable is entered at takes it, or the
	 * nearest child after or before that one which does, and so on down; a selectable none of whose
	 * children take it takes it itself. The selectables above are then entered at it.
	 *
	 * @returns whether the focus is in the selectable now. A disabled selectable does not take it,
	 * and nothing changes.
	 */
	focus(): boolean {
		if (this.disabled) return false;

		const entered = Math.max(get(this.focusIndex), 0);
		for (let i = entered; i < this.children.length; i++) {
			if (this.children[i]?.focus()) return true;
		}
		for (let i = Math.min(entered, this.children.length) - 1; i >= 0; i--) {
			if (this.children[i]?.focus()) return true;
		}

		if (!this.htmlElement) return false;

		const previous = get(Selectable.focusedObject);
		let propagate = true;
		let element = this.htmlElement;

		for (const selectable of Selectable.pathOf(this)) {
			if (propagate && !get(selectable.hasFocusWithin)) {
				selectable.onEnter?.({
					selectable,
					stopPropagation: () => {
						propagate = false;
					},
					focusElement: (focused) => {
						element = focused;
					}
				});
			}

			const index = selectable.parent?.children.indexOf(selectable) ?? -1;
			if (index !== -1) selectable.parent?._focusIndex.set(index);
		}

		element.focus({ preventScroll: true });
		Selectable.focusedObject.set(this);

		// What the focus has left: from the selectable that had it up to the first one it is still in
		for (const left of Selectable.pathOf(previous)) {
			if (get(left.hasFocusWithin)) break;
			if (!left.didUnmount) left.onBlur?.(left);
		}

		return true;
	}

	/**
	 * Enters the selectable at the child of the index. Only the selectable itself: what is above it
	 * stays entered as it was. A selectable that has the focus is entered already, so there the child
	 * takes the focus, and the index never points away from the focused child. An index without a
	 * child does nothing, as a disabled child in a selectable that has the focus.
	 */
	setFocusIndex(index: number) {
		const child = this.children[index];
		if (!child) return;

		if (get(this.hasFocusWithin)) child.focus();
		else this._focusIndex.set(index);
	}

	/** {@link setFocusIndex} of the parent, for what holds the selectable and not its position */
	activate() {
		const parent = this.parent;
		if (!parent) {
			console.error('No parent, undefined behavior?');
			return;
		}

		parent.setFocusIndex(parent.children.indexOf(this));
	}

	private isFocusable(): boolean {
		return !this.disabled;
	}

	private giveFocus(direction: Direction): boolean {
		function getSelectable(selectable: Selectable): {
			target?: Selectable;
			cycledParent?: Selectable;
		} {
			const focusIndex = get(selectable.focusIndex);

			const indexAddition = {
				up: selectable.direction === 'vertical' ? -1 : -selectable.gridColumns,
				down: selectable.direction === 'vertical' ? 1 : selectable.gridColumns,
				left:
					selectable.direction === 'horizontal'
						? (focusIndex % selectable.gridColumns) - 1 < 0
							? 0
							: -1
						: -selectable.gridColumns,
				right:
					selectable.direction === 'horizontal'
						? (focusIndex % selectable.gridColumns) + 1 >= selectable.gridColumns
							? 0
							: 1
						: selectable.gridColumns
			}[direction];

			// Cycle siblings
			if (indexAddition !== 0) {
				const totalRows = Math.ceil(selectable.children.length / indexAddition);
				const currentRow = Math.floor(focusIndex / indexAddition);
				let index =
					currentRow === totalRows - 1
						? focusIndex + indexAddition
						: Math.min(focusIndex + indexAddition, selectable.children.length - 1);
				while (index >= 0 && index < selectable.children.length) {
					const child = selectable.children[index];
					if (child && child.isFocusable()) {
						return { target: child, cycledParent: selectable };
					}
					index += indexAddition;
				}
			}

			if (!selectable.trapFocus) {
				const parent = selectable.parent;
				if (parent) return getSelectable(parent);
			}

			return {};
		}

		const options = { preventNavigation: false, propagate: true };

		function propagateNavigationEvent(selectable: Selectable, cycledParent?: Selectable) {
			const willLeaveContainer = cycledParent ? cycledParent !== selectable : false;
			selectable.onNavigate?.({
				selectable,
				direction,
				willLeaveContainer,
				preventNavigation: () => {
					options.preventNavigation = true;
				},
				stopPropagation: () => {
					options.propagate = false;
				}
			});

			if (options.propagate && selectable.parent) {
				propagateNavigationEvent(selectable.parent, willLeaveContainer ? cycledParent : undefined);
			}
		}

		const { target, cycledParent } = getSelectable(this);
		propagateNavigationEvent(this, cycledParent);

		if (target && !options.preventNavigation) return target.focus();

		if (options.preventNavigation) return true;

		return false;
	}

	static giveFocus(direction: Direction) {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus(direction);
	}

	/**
	 * Attaches the selectable to the container its element is in, after the siblings that precede it
	 * in the document, or makes it a root. Called from the action of the element, which Svelte 5 runs
	 * with the element in the document and, for a `<svelte:element>`, before the actions of the
	 * containers inside it: the parent is in the tree by then. On a plain element the actions inside
	 * would run first and find no parent.
	 */
	private attach() {
		const getParentSelectable = (htmlElement: HTMLElement): Selectable | undefined => {
			if (Selectable.objects.get(htmlElement)) return Selectable.objects.get(htmlElement);
			else if (htmlElement.parentElement) return getParentSelectable(htmlElement.parentElement);
			else return undefined;
		};

		// The children are in the order of the document, and a container usually mounts after all of
		// them, so they are looked at from the last one: every container of a long row is attached, and
		// looking at each sibling before it made a row of 200 cards take seconds on a TV
		const getPreviousSibling = (
			parent: Selectable,
			newChild: Selectable
		): Selectable | undefined => {
			const newHtmlElement = newChild.htmlElement;
			if (!newHtmlElement) return undefined;

			for (let index = parent.children.length - 1; index >= 0; index--) {
				const existingSibling = parent.children[index]!;
				// A sibling on its way out is removed once the teardown ends; it says nothing of the order
				if (existingSibling.didUnmount) continue;
				if (!existingSibling.htmlElement) {
					console.error('No html element found for', existingSibling);
					continue;
				}

				const position = newHtmlElement.compareDocumentPosition(existingSibling.htmlElement);
				if (position & Node.DOCUMENT_POSITION_DISCONNECTED) {
					console.warn(
						'Sibling is not in the document of the new child',
						parent.name || parent.htmlElement,
						'sibling',
						existingSibling.htmlElement,
						'new',
						newHtmlElement
					);
					continue;
				}
				if (position & Node.DOCUMENT_POSITION_PRECEDING) return existingSibling;
			}

			return undefined;
		};

		const htmlElement = this.htmlElement;
		const parentSelectable = htmlElement?.parentElement
			? getParentSelectable(htmlElement.parentElement)
			: undefined;

		if (parentSelectable) {
			const previousSibling = getPreviousSibling(parentSelectable, this);
			const childToFocus = parentSelectable.addChild(this, previousSibling);

			// console.debug(
			// 	'Attached child to parent',
			// 	this,
			// 	parentSelectable,
			// 	'previousSibling',
			// 	previousSibling
			// );

			if (childToFocus?.parent && get(childToFocus.parent.hasFocusWithin)) childToFocus.focus();
		} else {
			console.warn('Could not attach child (probably root)', this);
			Selectable.rootObjectsStack.push(this);
			this.focus();
		}
	}

	/**
	 * Called from the container's onMount, when the containers inside it are in the tree, with the
	 * props of the container that are about its mount.
	 *
	 * `focusOnMount` takes the focus, from wherever it is, unless the selectable has it already.
	 * `defaultFocus` never moves the focus: the selectable becomes what its parent is entered at, the
	 * parent what its own parent is entered at, and so on up to the first selectable that has the
	 * focus, which stays where it is.
	 */
	_mountSelectable({
		focusOnMount,
		defaultFocus
	}: {
		focusOnMount: boolean;
		defaultFocus: boolean;
	}) {
		if (focusOnMount && !get(this.hasFocusWithin)) this.focus();

		if (!this.htmlElement) {
			console.error('No html element found for', this);
			return;
		}

		if (defaultFocus) {
			for (const selectable of Selectable.pathOf(this)) {
				const parent = selectable.parent;
				if (!parent || get(parent.hasFocusWithin)) break;
				parent._focusIndex.set(parent.children.indexOf(selectable));
			}
		}
	}

	/**
	 * Called from the container's onMount cleanup. The removal waits for the end of the teardown, so
	 * that every container of the unmounting subtree is in the list and is removed in one pass, whatever
	 * order Svelte runs the cleanups and the action destroyers in (Svelte 5 runs the destroyers first).
	 */
	_unmountContainer() {
		const first = Selectable._childrenToRemove.length === 0;
		Selectable._childrenToRemove.push(this);
		this.didUnmount = true;
		if (first) Promise.resolve().then(Selectable.removeUnmounted);
	}

	private static removeUnmounted() {
		// The focused container and its ancestors, so that the removal of one of them is known before
		// the parent links go
		const focusedPath = Selectable.pathOf(get(Selectable.focusedObject));
		let parentToRefocus: Selectable | undefined = undefined;
		const parents = new Set<Selectable>();

		for (const child of Selectable._childrenToRemove) {
			const parent = child.parent;

			if (parent) {
				parents.add(parent);
				parent.removeChild(child);
				const last = parent.children.length - 1;
				if (last >= 0 && get(parent.focusIndex) > last) parent._focusIndex.set(last);

				// The topmost removed container that had the focus: its parent gives the focus to whatever
				// stands at the index now, as a replacement mounted in the same flush does
				if (focusedPath.includes(child) && !parent.didUnmount) parentToRefocus = parent;
			} else {
				const topRootIndex = Selectable.rootObjectsStack.indexOf(child);

				if (topRootIndex === Selectable.rootObjectsStack.length - 1) {
					Selectable.rootObjectsStack.pop();
					Selectable.rootObjectsStack[Selectable.rootObjectsStack.length - 1]?.focus();
				} else if (topRootIndex !== -1) {
					Selectable.rootObjectsStack.splice(topRootIndex, 1);
				}
			}

			if (child.htmlElement) {
				Selectable.objects.delete(child.htmlElement);
			}
		}

		Selectable._childrenToRemove = [];
		// The shifts that were counted are those of this teardown, undone or not
		for (const parent of parents) parent._addChildCount = 0;

		parentToRefocus?.focus();
	}

	private static pathOf(selectable: Selectable | undefined): Selectable[] {
		const path: Selectable[] = [];
		for (let current = selectable; current; current = current.parent) path.push(current);
		return path;
	}

	/**
	 * The action of the container's element: sets the htmlElement and attaches the selectable to the
	 * tree. See {@link attach}.
	 */
	createRegisterer() {
		return (htmlElement: HTMLElement) => {
			this.htmlElement = htmlElement;
			Selectable.objects.set(htmlElement, this);
			this.attach();
		};
	}

	/**
	 * @return {Selectable | undefined} child to be focused
	 */
	private addChild(child: Selectable, previousSibling?: Selectable): Selectable | undefined {
		const index: number = previousSibling ? this.children.indexOf(previousSibling) + 1 : 0;
		const focusIndex = get(this.focusIndex);
		let childToFocus: Selectable | undefined = undefined;

		if (child === this) {
			console.error('TRYING TO ADD SELF AS A CHILD', this);
			return;
		}

		// A child mounted where one is unmounting takes its place: the removal follows when the teardown
		// ends and undoes the shift of the index, which is what `_addChildCount` counts
		const replacesChild = this.children
			.slice(index, focusIndex + 1)
			.some((sibling) => sibling.didUnmount);
		const focusedChild = this.children[focusIndex];

		if (!replacesChild && this.children.length > 0 && index <= focusIndex) {
			// Mounted before the focused child, with nothing unmounting there: the index follows the child.
			// A container that has not had the focus yet is still entered at its first child
			if (focusIndex > 0 || (focusedChild && get(focusedChild.hasFocusWithin)))
				this._focusIndex.update((prev) => prev + 1);
		} else if (index === focusIndex) {
			// Increment
			// Do not refocus
			if (this._removedChildrenCount === 1) {
				childToFocus = child;
			} else if (this.children.length > 0) {
				this._addChildCount++;
				if (focusIndex > 0) this._focusIndex.update((prev) => prev + 1); // TODO: Maybe needs fixing pt1
			} else if (this.children.length === 0 && get(this.hasFocus)) {
				childToFocus = child;
			}

			if (this._removedChildrenCount > 1) {
				this._removedChildrenCount--;
			}
		} else if (index < focusIndex) {
			// Increment
			// Do not refocus
			this._addChildCount++;
			this._focusIndex.update((prev) => prev + 1);
		} else if (index > focusIndex) {
			// Do nothing
		}

		this.children.splice(index, 0, child);
		child.parent = this;

		return childToFocus;
	}

	private _removedChildCountTemp = 0;
	/** The focus is given afterwards, by {@link removeUnmounted} */
	private removeChild(child: Selectable) {
		const index = this.children.indexOf(child);
		const focusIndex = get(this.focusIndex);

		if (index === focusIndex) {
			if (this._addChildCount > 0) {
				this._addChildCount--;
				this._focusIndex.update((prev) => prev - 1);
			}

			if (!this._removedChildrenCount) this._removedChildrenCount = this._removedChildCountTemp + 1;
		} else if (index < focusIndex) {
			if (this._addChildCount > 1) this._addChildCount--;
			this._focusIndex.update((prev) => prev - 1);

			this._removedChildCountTemp++;
		} else if (index > focusIndex) {
			if (this._addChildCount > 0) {
				this._addChildCount--;
				// TODO: This might need fixing pt2
				if (focusIndex > 0) this._focusIndex.update((prev) => prev - 1);
			}
		}

		this.children = this.children.filter((c) => c !== child);
		child.parent = undefined;
	}

	select() {
		this.onSelect?.(this);
	}

	hasLongPress() {
		return this.onLongPress !== undefined;
	}

	longPress() {
		this.onLongPress?.(this);
	}

	/** Sends back up the tree from the selectable, until a handler stops it */
	back(options = { propagate: true }) {
		this.onBack?.({
			selectable: this,
			stopPropagation: () => {
				options.propagate = false;
			}
		});
		if (this.parent && options.propagate) this.parent.back(options);
	}

	getParent() {
		return this.parent;
	}

	getChildren() {
		return this.children;
	}

	getSibling(index: number) {
		const parent = this.parent;
		if (!parent) return undefined;
		const siblings = parent.getChildren();
		const selfIndex = siblings.indexOf(this);
		return siblings[selfIndex + index];
	}

	getRootParent(): Selectable | undefined {
		let parent = this.parent;
		while (parent?.parent) {
			parent = parent.parent;
		}

		return parent;
	}

	getHtmlElement() {
		return this.htmlElement;
	}
}

const LONG_PRESS_DURATION = 600;
// Remotes repeat the key while it is held, and a key up can go missing when the
// focus moves elsewhere, so a press that is older than this counts as a new one
const PRESS_REPEAT_TIMEOUT = 1000;

// A held enter key is one press until it is released. For a selectable with a
// long press handler the press is decided when the key is released or the
// long press duration passes, for others it selects right away.
let enterPress:
	| {
			selectable: Selectable;
			lastKeyDown: number;
			timer?: ReturnType<typeof setTimeout>;
			longPressed: boolean;
	  }
	| undefined;

function handleEnterKeyDown(selectable: Selectable, shiftKey: boolean) {
	const now = Date.now();

	if (enterPress && now - enterPress.lastKeyDown < PRESS_REPEAT_TIMEOUT) {
		enterPress.lastKeyDown = now;
		return;
	}

	if (enterPress?.timer) clearTimeout(enterPress.timer);
	enterPress = { selectable, lastKeyDown: now, longPressed: false };

	if (shiftKey && selectable.hasLongPress()) {
		enterPress.longPressed = true;
		selectable.longPress();
	} else if (!selectable.hasLongPress()) {
		selectable.select();
	} else {
		enterPress.timer = setTimeout(() => {
			if (!enterPress) return;
			enterPress.timer = undefined;
			enterPress.longPressed = true;
			selectable.longPress();
		}, LONG_PRESS_DURATION);
	}
}

export function handleKeyboardNavigationKeyUp(event: KeyboardEvent) {
	if (event.key !== 'Enter' || !enterPress) return;

	const press = enterPress;
	enterPress = undefined;

	if (press.timer) {
		clearTimeout(press.timer);
		press.selectable.select();
	}
}

export function handleKeyboardNavigation(event: KeyboardEvent) {
	const currentlyFocusedObject = get(Selectable.focusedObject);

	if (!currentlyFocusedObject) {
		console.error('No focused object!!!');
		// Find object that can be focused
		Selectable.objects.forEach((container) => container.focus());
		return;
	}

	if (event.key === 'ArrowUp' && !event.metaKey && !event.ctrlKey) {
		setMouseMode(false);
		if (Selectable.giveFocus('up')) {
			event.preventDefault();
		}
	} else if (event.key === 'ArrowDown' && !event.metaKey && !event.ctrlKey) {
		setMouseMode(false);
		if (Selectable.giveFocus('down')) {
			event.preventDefault();
		}
	} else if (event.key === 'ArrowLeft' && !event.metaKey && !event.ctrlKey) {
		setMouseMode(false);
		if (Selectable.giveFocus('left')) {
			event.preventDefault();
		}
	} else if (event.key === 'ArrowRight' && !event.metaKey && !event.ctrlKey) {
		setMouseMode(false);
		if (Selectable.giveFocus('right')) {
			event.preventDefault();
		}
	} else if (event.key === 'Enter') {
		handleEnterKeyDown(currentlyFocusedObject, event.shiftKey);
	} else if (event.key === 'Back' || event.key === 'XF86Back' || event.key === 'Escape') {
		currentlyFocusedObject.back();
	} else {
		return;
	}

	event.preventDefault();
}

/** Scrolls the element into view on focus, unless the focus follows the mouse; `always` scrolls then too */
export const scrollIntoView =
	({ always = false, ...offsets }: Offsets & { always?: boolean }) =>
	(e: EnterEvent) => {
		const element = e.selectable.getHtmlElement();

		if (element && (always || !mouseMode)) {
			scrollElementIntoView(element, offsets);
		}
	};

/**
 * For `onMounted`: a container mounted directly before the focused one takes the focus from it, as
 * the main action of a row does when it arrives after the focus was given to the action next to it
 */
export const takeFocusFromNext = (selectable: Selectable) => {
	const next = selectable.getSibling(1);
	if (next && get(next.hasFocus)) selectable.focus();
};

export const scrollToTop = (e: KeyEvent) => {
	const selectable = e.selectable;
	if (get(selectable.focusIndex) !== 0) {
		selectable.getChildren()[0]?.focus();
		e.stopPropagation();
	}
};

Selectable.focusedObject.subscribe((e) => console.debug('Focused object', e));
