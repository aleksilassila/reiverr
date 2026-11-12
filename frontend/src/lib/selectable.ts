import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { type Offsets, scrollElementIntoView } from './scroll-into-view';

export type Direction = 'up' | 'down' | 'left' | 'right';
type FlowDirection = 'vertical' | 'horizontal';

type FocusEventOptions = {
	/** Whether the browser's focus moves too, and to which element in place of the selectable's own */
	setFocusedElement: boolean | HTMLElement;
	propagate: boolean;
};

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
	disabled?: boolean;
	focusedChild?: boolean;
	/** The selectable or something in it got the focus */
	onEnter?: (e: EnterEvent) => void;
	/** The d-pad moves the focus from the selectable or from something in it */
	onNavigate?: (e: NavigateEvent) => void;
	/** The d-pad moves the focus out of the selectable; not called when the focus leaves another way */
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
	private makeFocusedChild: boolean = false;

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

	focusIndex: Writable<number> = writable(0);
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
		this.makeFocusedChild = config.focusedChild ?? false;
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
			parent.focusIndex.set(parent.children.indexOf(focusedChild));
	}

	focus(options: Partial<FocusEventOptions> = {}) {
		function propagateFocusUpdates(options: FocusEventOptions, selectable: Selectable) {
			if (options.propagate && !get(selectable.hasFocusWithin)) {
				selectable.onEnter?.({
					selectable,
					stopPropagation: () => {
						options.propagate = false;
					},
					focusElement: (element) => {
						if (options.setFocusedElement) options.setFocusedElement = element;
					}
				});
			}

			const parent = selectable.parent;

			if (parent) {
				const updateParentFocusIndex = options.setFocusedElement || !get(parent?.hasFocusWithin);
				if (updateParentFocusIndex) {
					const index = parent.children.indexOf(selectable);
					parent.focusIndex.update((prev) => (index === -1 ? prev : index));

					propagateFocusUpdates(options, parent);
				}
			}
		}

		if (this.children.length > 0) {
			const focusIndex = get(this.focusIndex);

			if (this.children[focusIndex]?.isFocusable()) {
				this.children[focusIndex]?.focus(options);
				return;
			} else {
				let i = focusIndex;
				while (i < this.children.length) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus(options);
						return;
					}
					i++;
				}
				i = focusIndex - 1;
				while (i >= 0) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus(options);
						return;
					}
					i--;
				}
			}
		}

		if (this.htmlElement) {
			const _options: FocusEventOptions = { setFocusedElement: true, propagate: true, ...options };
			propagateFocusUpdates(_options, this);

			if (_options.setFocusedElement) {
				if (_options.setFocusedElement === true) {
					this.htmlElement.focus({ preventScroll: true });
				} else {
					_options.setFocusedElement.focus({ preventScroll: true });
				}
				Selectable.focusedObject.set(this);
			}
		}
	}

	focusChild(index: number, options?: Partial<FocusEventOptions>): boolean {
		// TODO: CLEAN UP
		const child = this.children[index];
		if (child && child.isFocusable()) {
			child.focus(options);
			return true;
		}

		return false;
	}

	/**
	 * Focuses child if parent has focus, otherwise sets focusIndex to child index
	 */
	activate() {
		const parent = this.parent;
		if (!parent) {
			console.error('No parent, undefined behavior?');
			return;
		}

		const parentHasFocus = get(parent.hasFocusWithin);

		if (parentHasFocus) {
			this.focus();
		} else {
			const index = parent.children.indexOf(this);
			if (index === -1) console.error('Child not found in parent when activating', this, parent);
			this.parent?.focusIndex.update((prev) => (index >= 0 ? index : prev));
		}
	}

	/**
	 * @see {@link Selectable.activate}
	 * @param index index of child to activate
	 */
	activateChild(index: number) {
		const child = this.children[index];
		if (child) {
			child.activate();
		}
	}

	/**
	 * @returns {boolean} whether the selectable is focusable
	 */
	isFocusable(): boolean {
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
			if (willLeaveContainer) selectable.onBlur?.(selectable);

			if (options.propagate && selectable.parent) {
				propagateNavigationEvent(selectable.parent, willLeaveContainer ? cycledParent : undefined);
			}
		}

		const { target, cycledParent } = getSelectable(this);
		propagateNavigationEvent(this, cycledParent);

		if (target && !options.preventNavigation) {
			target.focus();
			return true;
		}

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

		const getPreviousSibling = (
			parent: Selectable,
			newChild: Selectable
		): Selectable | undefined => {
			const getAncestors = (start: HTMLElement, end: HTMLElement): HTMLElement[] => {
				let element = start;
				const elements: HTMLElement[] = [start];

				while (element !== end) {
					if (element.parentElement) element = element.parentElement;
					else break;
					elements.push(element);
				}

				return elements;
			};

			const newHtmlElement = newChild.htmlElement;
			if (!newHtmlElement) return undefined;

			const parentHtmlElement = parent.htmlElement;

			if (!parentHtmlElement) return undefined;

			const newElementAncestors = getAncestors(newHtmlElement, parentHtmlElement);

			let previousSibling: Selectable | undefined = undefined;

			for (const existingSibling of parent.children) {
				// A sibling on its way out is removed once the teardown ends; it says nothing of the order
				if (existingSibling.didUnmount) continue;
				// Does not contain this yet
				if (!existingSibling.htmlElement) {
					console.error('No html element found for', existingSibling);
					continue;
				}
				const siblingElementTree: HTMLElement[] = getAncestors(
					existingSibling.htmlElement,
					parentHtmlElement
				);

				const commonParentElement = newElementAncestors.find((element) =>
					siblingElementTree.includes(element)
				);
				const newSibling = newElementAncestors.find(
					(element) => element.parentElement && siblingElementTree.includes(element.parentElement)
				);
				const targetSibling = siblingElementTree.find(
					(element) => element.parentElement && newElementAncestors.includes(element.parentElement)
				);
				if (!newSibling || !targetSibling || !commonParentElement) {
					console.warn(
						"Couldn't find common parent element",
						parent.name || parent.htmlElement,
						'sibling',
						existingSibling.htmlElement,
						existingSibling.htmlElement.isConnected ? 'connected' : 'detached',
						'new',
						newHtmlElement
					);
					continue;
				}
				const allSiblingElements = Array.from(commonParentElement.children);

				if (allSiblingElements.indexOf(targetSibling) < allSiblingElements.indexOf(newSibling)) {
					previousSibling = existingSibling;
				} else break;
			}

			return previousSibling;
		};

		const htmlElement = this.htmlElement;
		const parentSelectable = htmlElement?.parentElement
			? getParentSelectable(htmlElement.parentElement)
			: undefined;

		if (parentSelectable) {
			const previousSibling = getPreviousSibling(parentSelectable, this);
			const childToFocus = parentSelectable.addChild(this, previousSibling);

			console.debug(
				'Attached child to parent',
				this,
				parentSelectable,
				'previousSibling',
				previousSibling
			);

			if (childToFocus?.parent && get(childToFocus.parent.hasFocusWithin)) childToFocus.focus();
		} else {
			console.warn('Could not attach child (probably root)', this);
			Selectable.rootObjectsStack.push(this);
			this.focus();
		}
	}

	/**
	 * Called from the container's onMount, when the containers inside it are in the tree.
	 */
	_mountSelectable(focusOnMount: boolean = false) {
		if (!get(this.hasFocusWithin) && this.isFocusable() && focusOnMount) {
			this.focus(); // TODO: CLEAN UP
		}

		if (!this.htmlElement) {
			console.error('No html element found for', this);
			return;
		}

		if (this.makeFocusedChild) {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			let el: Selectable = this;
			let parent = el.parent;

			while (parent && !get(parent.hasFocusWithin)) {
				console.debug('setting parent focusIndex', parent, parent.children.indexOf(el));
				parent.focusIndex.update((prev) => parent?.children?.indexOf(el) || prev);

				el = parent;
				parent = el.parent;
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
				if (last >= 0 && get(parent.focusIndex) > last) parent.focusIndex.set(last);

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
				this.focusIndex.update((prev) => prev + 1);
		} else if (index === focusIndex) {
			// Increment
			// Do not refocus
			if (this._removedChildrenCount === 1) {
				childToFocus = child;
			} else if (this.children.length > 0) {
				this._addChildCount++;
				if (focusIndex > 0) this.focusIndex.update((prev) => prev + 1); // TODO: Maybe needs fixing pt1
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
			this.focusIndex.update((prev) => prev + 1);
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
				this.focusIndex.update((prev) => prev - 1);
			}

			if (!this._removedChildrenCount) this._removedChildrenCount = this._removedChildCountTemp + 1;
		} else if (index < focusIndex) {
			if (this._addChildCount > 1) this._addChildCount--;
			this.focusIndex.update((prev) => prev - 1);

			this._removedChildCountTemp++;
		} else if (index > focusIndex) {
			if (this._addChildCount > 0) {
				this._addChildCount--;
				// TODO: This might need fixing pt2
				if (focusIndex > 0) this.focusIndex.update((prev) => prev - 1);
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
		Selectable.objects.forEach((container) => {
			if (container.isFocusable()) {
				container.focus();
			}
		});
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
		selectable.focusChild(0);
		e.stopPropagation();
	}
};

Selectable.focusedObject.subscribe((e) => console.debug('Focused object', e));
