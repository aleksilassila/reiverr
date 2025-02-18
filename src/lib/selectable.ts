import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { getScrollParent } from './utils';
import { localSettings } from './stores/localstorage.store';

export type BackEvent = CustomEvent<KeyEvent>;

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };
export type Registrar = (e: CustomEvent<Selectable>) => () => void;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';

type FocusEventOptions = {
	setFocusedElement: boolean | HTMLElement;
	propagate: boolean;
	cycleTo?: boolean;
	onFocus?: (
		superOnFocus: FocusHandler,
		...args: Parameters<FocusHandler>
	) => ReturnType<FocusHandler>;
};

export type EnterEvent = {
	selectable: Selectable;
	options: FocusEventOptions;
	stopPropagation: () => void;
};

const createFocusHandlerOptions = (): FocusEventOptions => ({
	setFocusedElement: true,
	propagate: true
});

type NavigateEventOptions = {
	target?: Selectable;
	preventNavigation: boolean;
	propagate: boolean;
	direction: Direction;
};

export type NavigateEvent = {
	selectable: Selectable;
	direction: Direction;
	willLeaveContainer: boolean;
	options: NavigateEventOptions;
	preventNavigation: () => void;
	stopPropagation: () => void;
};

const createNavigateHandlerOptions = (
	target: Selectable | undefined,
	direction: Direction
): NavigateEventOptions => ({
	target,
	preventNavigation: false,
	propagate: true,
	direction
});

type KeyEventOptions = {
	propagate: boolean;
	target: Selectable;
};

export type KeyEvent = {
	selectable: Selectable;
	options: KeyEventOptions;
	stopPropagation: () => void;
	bubble: () => void;
};

const createKeyEventOptions = (target: Selectable): KeyEventOptions => ({
	propagate: true,
	target
});

export type FocusHandler = (selectable: Selectable, options: FocusEventOptions) => void;
export type NavigationHandler = (
	selectable: Selectable,
	options: NavigateEventOptions,
	willLeaveContainer: boolean
) => void;
export type KeyEventHandler = (selectable: Selectable, options: KeyEventOptions) => void;

export type ActiveChildStore = typeof Selectable.prototype.activeChild;

enum FocusOrder {
	First,
	Last
}

export class Selectable {
	id: number;
	name: string;
	private parent?: Selectable;
	private children: Selectable[] = [];
	private htmlElement?: HTMLElement;
	private makeFocusedChild: boolean = false;

	private trapFocus: boolean = false;
	private disabled: boolean = true;

	private onNavigate: NavigationHandler = () => {};
	private onFocus: FocusHandler = () => {};
	private onBack: KeyEventHandler = () => {};
	private onPlayPause: KeyEventHandler = () => {};
	private onSelect?: () => void;

	private direction: FlowDirection = 'vertical';
	private gridColumns: number = 0;
	private _removedChildrenCount: number = 0;
	private _addChildCount = 0;

	private static _initializationStack: Selectable[] = [];
	private static _childrenToRemove: Selectable[] = [];

	static focusedObject: Writable<Selectable | undefined> = writable(undefined);

	focusIndex: Writable<number> = writable(0);

	activeChild = (() => {
		const store = derived(this.focusIndex, (focusIndex) => {
			return this.children[focusIndex];
		});

		const set = (selectable: Selectable) => {
			const index = this.children.indexOf(selectable);
			if (index !== -1) this.focusIndex.set(index);
		};

		return {
			subscribe: store.subscribe,
			set
		};
	})();
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

	static objects = new Map<HTMLElement, Selectable>();
	static rootObjectsStack: Selectable[] = [];

	constructor(name: string = '') {
		this.id = Math.floor(Math.random() * 1000000);
		this.name = name;
	}

	setDirection(direction: FlowDirection) {
		this.direction = direction;
		return this;
	}

	setHtmlElement(htmlElement: HTMLElement) {
		this.htmlElement = htmlElement;
		Selectable.objects.set(htmlElement, this);
		return this;
	}

	focus(options: Partial<FocusEventOptions> = {}) {
		function propagateFocusUpdates(options: FocusEventOptions, selectable: Selectable) {
			if (options.propagate && options.onFocus)
				options.onFocus(selectable.onFocus, selectable, options);
			else if (options.propagate && !get(selectable.hasFocusWithin))
				selectable.onFocus(selectable, options);

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
			const _options: FocusEventOptions = {
				...createFocusHandlerOptions(),
				...options
			};
			propagateFocusUpdates(_options, this);

			if (_options.setFocusedElement) {
				if (_options.cycleTo) {
					const previouslyFocused = get(Selectable.focusedObject);
					if (previouslyFocused) {
						const parents = this.getParents();
						const otherParents = [];
						let commonParent: Selectable | undefined = undefined;

						let el = previouslyFocused;
						while (el) {
							const parent = el.parent;
							if (parent) otherParents.push(parent);
							if (parent && parents.includes(parent)) {
								commonParent = parent;
								// const thisBeforeParent = parents[parents.indexOf(commonParent) - 1];
								// after = thisBeforeParent
								// 	? parent.children.indexOf(el) < parent.children.indexOf(thisBeforeParent)
								// 	: false;
								// thatChild = parents[parents.indexOf(commonParent) - 1];
								break;
							} else if (parent) {
								el = parent;
							} else break;
						}

						if (commonParent) {
							const targetChild = parents[parents.indexOf(commonParent) - 1];
							const previousChild = otherParents[otherParents.indexOf(commonParent) - 1];

							let order: FocusOrder | undefined = undefined;
							const direction = commonParent.direction;
							for (const child of commonParent.children) {
								if (child === targetChild) {
									if (order !== undefined) {
										break;
									}
									order = FocusOrder.First;
									continue;
								} else if (child === previousChild) {
									if (order !== undefined) {
										child.recursiveSetFocusIndex(direction, order);
										break;
									}
									order = FocusOrder.Last;
								}

								if (order !== undefined) {
									child.recursiveSetFocusIndex(direction, order);
								}
							}
						}
					}
				}

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
	 * @returns {boolean} whether the selectable is focusable
	 */
	isFocusable(): boolean {
		return !this.disabled;
	}

	private giveFocus(direction: Direction, fireActions: boolean = true): boolean {
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

		function propagateNavigationEvent(
			selectable: Selectable,
			options: NavigateEventOptions,
			cycledParent?: Selectable
		) {
			const willLeaveContainer = cycledParent ? cycledParent !== selectable : false;
			selectable.onNavigate(selectable, options, willLeaveContainer);

			if (options.propagate && selectable.parent) {
				propagateNavigationEvent(
					selectable.parent,
					options,
					willLeaveContainer ? cycledParent : undefined
				);
			}
		}

		const { target, cycledParent } = getSelectable(this);
		const navigationEventOptions = createNavigateHandlerOptions(target, direction);
		if (fireActions) propagateNavigationEvent(this, navigationEventOptions, cycledParent);

		if (target && !navigationEventOptions.preventNavigation) {
			target.focus();
			return true;
		}

		if (navigationEventOptions.preventNavigation) return true;

		return false;
	}

	static giveFocus(direction: Direction, fireActions?: boolean) {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus(direction, fireActions);
	}

	/**
	 * Components are mounted in reverse order, such that a child and its siblings are mounted before the parent.
	 * This function initializes the parent-child tree structure by iterating through the initialization stack,
	 * adding children under their parents. This is done in the registration phase, before anything is mounted to
	 * the DOM (before onMount is called on these elements). The output is a set of parent root nodes (usually
	 * just one), that will be mounted to the dom.
	 *
	 * See {@link finalizeTreeStructure} for the finalization
	 */
	private static initializeTreeStructure() {
		for (let i = 0; i < Selectable._initializationStack.length; i++) {
			const selectable = Selectable._initializationStack[i];
			const htmlElement = selectable?.getHtmlElement();

			const previousSelectable = Selectable._initializationStack[i - 1];
			const previousHtmlElement = previousSelectable?.getHtmlElement();

			const isParent =
				htmlElement && previousHtmlElement && htmlElement.contains(previousHtmlElement);
			if (isParent && selectable && previousSelectable && htmlElement && previousHtmlElement) {
				// Add all previous elements as children
				for (let j = i - 1; j >= 0; j--) {
					const potentialChild = Selectable._initializationStack[j];
					if (potentialChild && htmlElement.contains(potentialChild.htmlElement || null)) {
						selectable.addChild(potentialChild, undefined, true);
						Selectable._initializationStack.splice(j, 1);
						i = j;
					} else break;
				}
			}
		}
	}

	/**
	 * For tree structure initialization, see {@link initializeTreeStructure}.
	 *
	 * This function iterates through the root nodes, created in the initialization phase, that are to be mounted
	 * to the DOM. It adds the to-be-mounted root elements as children to the already mounted parent elements.
	 *
	 * The initialization and finalization phases must be separated, because when a new selectable is registered
	 * and assigned a htmlElement, its to-be-parent selectable hasn't been assigned a htmlElement yet. As a result,
	 * when a html element is registered to a selectable, we don't know if that selectable is the last parent (root)
	 * that will be mounted, or if there's more parents that hasn't been initialized yet, hence we can't attach it
	 * to already mounted parent. The solution is to first create the parent-child structure of to-be-mounted elements
	 * using [Svelte Actions](https://svelte.dev/docs/svelte-action) (initialization), and when the first element
	 * mounts (onMount is called), we have all to-be-mounted elements and can attach them to the already mounted
	 * parent elements (finalization).
	 */
	private static finalizeTreeStructure() {
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
						newSibling,
						targetSibling,
						commonParentElement
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

		let childToFocus: Selectable | undefined = undefined;

		for (const child of this._initializationStack) {
			const htmlElement = child.htmlElement;
			const parentSelectable = htmlElement?.parentElement
				? getParentSelectable(htmlElement.parentElement)
				: undefined;

			if (parentSelectable) {
				const previousSibling = getPreviousSibling(parentSelectable, child);

				const toFocus = parentSelectable.addChild(child, previousSibling);
				if (toFocus) childToFocus = toFocus;

				console.debug(
					'Attached child tree to parent',
					child,
					parentSelectable,
					'previousSibling',
					previousSibling
				);
			} else {
				console.warn('Could not attach child (probably root)', child);
				Selectable.rootObjectsStack.push(child);
				child.focus();
			}
		}

		if (childToFocus?.parent && get(childToFocus.parent.hasFocusWithin)) childToFocus.focus();
		// if (childToFocus) console.log("Focusing child that's being added", childToFocus);
		// childToFocus?.focus();

		Selectable._initializationStack = [];
	}

	/**
	 * Attaches new selectable to an existing, already mounted parent selectable.
	 * See {@link finalizeTreeStructure} for more information.
	 */
	_mountSelectable(focusOnMount: boolean = false) {
		// console.debug('Mounting', this, Selectable._initializationStack.slice());

		Selectable.finalizeTreeStructure();

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

	_unmountContainer() {
		// This is called before the registrars are destroyed,
		// though the initialization finalization process doesn't
		// work because unmount and destroy are both called
		// before the next element unmounts :(
		Selectable._childrenToRemove.push(this);
	}

	/**
	 * This only sets the htmlElement. See {@link _mountSelectable} for the rest of the initialization.
	 */
	private static createRegisterer(
		_selectable?: Selectable,
		flowDirection: FlowDirection = 'vertical'
	): Registerer {
		const selectable = _selectable || new Selectable().setDirection(flowDirection);

		return (htmlElement: HTMLElement) => {
			selectable.setHtmlElement(htmlElement);
			Selectable._initializationStack.push(selectable);
			Selectable.initializeTreeStructure();

			return {
				destroy: () => {
					let elementToFocus: Selectable | undefined = undefined;
					for (const child of Selectable._childrenToRemove) {
						// console.warn('Removing child', child, 'from parent', child.parent);
						const parent = child.parent;

						if (parent) {
							const childToFocus = child.parent?.removeChild(child);

							if (get(parent.hasFocusWithin) && childToFocus) elementToFocus = childToFocus;
							else if (childToFocus) {
								const index = parent.children.indexOf(childToFocus);

								if (index !== -1) {
									parent.focusIndex.set(index);
								} else {
									console.error(
										"Couldn't find index of child to focus",
										childToFocus,
										parent.children
									);
								}
							} else if (parent.children.length === 0 && get(parent.hasFocusWithin)) {
								elementToFocus = parent;
								console.warn('Focusing parent after last child unmount', parent);
							}
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

					if (elementToFocus) {
						console.log('Focusing element after unmount', elementToFocus);
						if (elementToFocus.parent && get(elementToFocus.parent.hasFocusWithin)) {
							console.log('executing focus after unmount');
							elementToFocus.focus();
							console.log('activeElement', document.activeElement);
						}
					}
				}
			};
		};
	}

	static getRegisterer(flowDirection: FlowDirection = 'vertical'): Registerer {
		return (htmlElement: HTMLElement) =>
			this.createRegisterer(undefined, flowDirection)(htmlElement);
	}

	getRegisterer(): Registerer {
		return (htmlElement: HTMLElement) => Selectable.createRegisterer(this)(htmlElement);
	}

	static getStores(element: HTMLElement) {
		return Selectable.objects.get(element)?.getStores();
	}

	getStores(): {
		container: Selectable;
		hasFocus: Readable<boolean>;
		hasFocusWithin: Readable<boolean>;
		registerer: Registerer;
		focusIndex: Writable<number>;
		activeChild: ActiveChildStore;
	} {
		return {
			container: this,
			hasFocus: this.hasFocus,
			hasFocusWithin: this.hasFocusWithin,
			registerer: this.getRegisterer(),
			focusIndex: this.focusIndex,
			activeChild: this.activeChild
		};
	}

	private _addChildCountTemp = 0;
	/**
	 * @return {Selectable | undefined} child to be focused
	 */
	private addChild(
		child: Selectable,
		previousSibling?: Selectable,
		initialization = false
	): Selectable | undefined {
		const index: number = previousSibling ? this.children.indexOf(previousSibling) + 1 : 0;
		const focusIndex = get(this.focusIndex);
		let childToFocus: Selectable | undefined = undefined;

		// console.log('Adding child to parent', child, this, index, this.children.slice());
		if (child === this) {
			console.error('TRYING TO ADD SELF AS A CHILD', this);
			return;
		}

		if (index === focusIndex) {
			// console.log('Adding to focusIndex', index, this._removedChildrenCount);

			// Increment
			// Do not refocus
			if (this._removedChildrenCount === 1) {
				childToFocus = child;
			} else if (this.children.length > 0 && !initialization) {
				this._addChildCount++;
				// console.log('Incremented addChildCount to', this._addChildCount);
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
			// console.log('Incremented addChildCount to', this._addChildCount);
			this.focusIndex.update((prev) => prev + 1);
		} else if (index > focusIndex) {
			// Do nothing
		}

		this.children.splice(index, 0, child);
		child.parent = this;

		return childToFocus;
	}

	private _removedChildCountTemp = 0;
	/**
	 * @return {Selectable | undefined} child to be focused
	 */
	private removeChild(child: Selectable): Selectable | undefined {
		const index = this.children.indexOf(child);
		const focusIndex = get(this.focusIndex);
		let childToFocus: Selectable | undefined = undefined;
		// console.log(
		// 	'removing child',
		// 	child,
		// 	'from parent',
		// 	this,
		// 	'index',
		// 	index,
		// 	'focusIndex',
		// 	focusIndex
		// );

		if (index === focusIndex) {
			if (this._addChildCount > 0) {
				this._addChildCount--;
				this.focusIndex.update((prev) => prev - 1);
				childToFocus = this.children[focusIndex - 1];
			} else {
				// Do not decrement
				// Refocus
				childToFocus = this.children[focusIndex + 1] || this.children[focusIndex - 1];
			}

			if (!this._removedChildrenCount) this._removedChildrenCount = this._removedChildCountTemp + 1;
		} else if (index < focusIndex) {
			// Decrement
			// Do not refocus
			if (this._addChildCount > 1) {
				this._addChildCount--;
				this.focusIndex.update((prev) => prev - 1);
			} else {
				this.focusIndex.update((prev) => prev - 1);
			}

			this._removedChildCountTemp++;
		} else if (index > focusIndex) {
			if (this._addChildCount > 0) {
				this._addChildCount--;
				if (focusIndex > 0) {
					// TODO: This might need fixing pt2
					this.focusIndex.update((prev) => prev - 1);
					childToFocus = this.children[focusIndex - 1];
				} else childToFocus = this.children[focusIndex];
			} else {
				// Do nothing
			}
		}

		this.children = this.children.filter((c) => c !== child);
		child.parent = undefined;

		return childToFocus;
	}

	private getParents(): Selectable[] {
		const parents = [];

		let parent = this.parent;
		while (parent) {
			parents.push(parent);
			parent = parent.parent;
		}

		return parents;
	}

	private recursiveSetFocusIndex(direction: FlowDirection, order: FocusOrder) {
		for (const child of this.children) {
			child.recursiveSetFocusIndex(direction, order);
		}

		if (this.direction === direction || this.gridColumns) {
			if (order === FocusOrder.First) {
				this.focusIndex.set(0);
			} else {
				this.focusIndex.set(this.children.length - 1);
			}
		}
	}

	private getCommonParent(other: Selectable): Selectable | undefined {
		const parents = this.getParents();
		const otherParents = other.getParents();

		for (const parent of parents) {
			if (otherParents.includes(parent)) return parent;
		}

		return undefined;
	}

	select() {
		this.onSelect?.();
	}

	back(options?: KeyEventOptions) {
		const _options = options || createKeyEventOptions(this);
		this.onBack(this, _options);
		if (this.parent && _options.propagate) this.parent.back(_options);
	}

	playPause(options?: KeyEventOptions) {
		const _options = options || createKeyEventOptions(this);
		this.onPlayPause(this, _options);
		if (this.parent && _options.propagate) this.parent.playPause(_options);
	}

	getFocusedChild() {
		return this.children[get(this.focusIndex)];
	}

	getParent() {
		return this.parent;
	}

	setIsDisabled(disabled: boolean) {
		this.disabled = disabled;
		return this;
	}

	setGridColumns(columns: number) {
		this.gridColumns = columns;
		return this;
	}

	getGridColumns() {
		return this.gridColumns;
	}

	getHtmlElement() {
		return this.htmlElement;
	}

	setTrapFocus(trapFocus: boolean) {
		this.trapFocus = trapFocus;
		return this;
	}

	setOnFocus(onFocus: typeof this.onFocus) {
		this.onFocus = onFocus;
		return this;
	}

	setOnSelect(onSelect: () => void) {
		this.onSelect = onSelect;
		return this;
	}

	setOnNavigate(onNavigate: NavigationHandler) {
		this.onNavigate = onNavigate;
		return this;
	}

	setOnBack(onBack: KeyEventHandler) {
		this.onBack = onBack;
		return this;
	}

	setOnPlayPause(onPlayPause: KeyEventHandler) {
		this.onPlayPause = onPlayPause;
		return this;
	}

	setAsFocusedChild(focusedChild: boolean) {
		this.makeFocusedChild = focusedChild;
		return this;
	}
}

export function handleKeyboardNavigation(event: KeyboardEvent) {
	// console.time('handleKeyboardNavigation');

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

	if (event.key === 'ArrowUp') {
		if (Selectable.giveFocus('up')) event.preventDefault();
	} else if (event.key === 'ArrowDown') {
		if (Selectable.giveFocus('down')) event.preventDefault();
	} else if (event.key === 'ArrowLeft') {
		if (Selectable.giveFocus('left')) event.preventDefault();
	} else if (event.key === 'ArrowRight') {
		if (Selectable.giveFocus('right')) event.preventDefault();
	} else if (event.key === 'Enter') {
		currentlyFocusedObject.select();
	} else if (event.key === 'Back' || event.key === 'XF86Back' || event.key === 'Escape') {
		currentlyFocusedObject.back();
	} else if (event.key === 'MediaPlayPause') {
		currentlyFocusedObject.playPause();
	} else {
		return;
	}

	event.preventDefault();

	// console.timeEnd('handleKeyboardNavigation');
}

Selectable.focusedObject.subscribe((e) => console.debug('Focused object', e));

type Offsets = Partial<
	Record<
		'top' | 'bottom' | 'left' | 'right' | 'horizontal' | 'vertical' | 'all',
		number | undefined
	>
>;
export const scrollElementIntoView = (htmlElement: HTMLElement, offsets: Offsets = { all: 16 }) => {
	if (offsets.vertical !== undefined) {
		offsets.top = offsets.vertical;
		offsets.bottom = offsets.vertical;
	}

	if (offsets.horizontal !== undefined) {
		offsets.left = offsets.horizontal;
		offsets.right = offsets.horizontal;
	}

	if (offsets.all !== undefined) {
		offsets.top = offsets.all;
		offsets.bottom = offsets.all;
		offsets.left = offsets.all;
		offsets.right = offsets.all;
	}

	const scrollBehavior: ScrollBehavior = get(localSettings).animateScrolling ? 'smooth' : 'instant';

	const boundingRect = htmlElement.getBoundingClientRect();
	const verticalParent = getScrollParent(htmlElement, 'vertical');
	const horizontalParent = getScrollParent(htmlElement, 'horizontal');

	if (verticalParent && (offsets.top !== undefined || offsets.bottom !== undefined)) {
		const parentBoundingRect = verticalParent.getBoundingClientRect();

		let top = -1;

		if (offsets.top !== undefined && offsets.bottom !== undefined) {
			const topClipsAbove = boundingRect.y - parentBoundingRect.y < offsets.top;
			const bottomClipsBelow =
				boundingRect.y + boundingRect.height >
				parentBoundingRect.y + parentBoundingRect.height - offsets.bottom;

			const distanceToParentTop = verticalParent.scrollTop + boundingRect.y - parentBoundingRect.y;
			const distanceToParentBottom =
				verticalParent.scrollHeight -
				verticalParent.scrollTop -
				(boundingRect.y - parentBoundingRect.y) -
				boundingRect.height;

			const reverse =
				boundingRect.height > verticalParent.clientHeight - offsets.top - offsets.bottom;

			if (
				(topClipsAbove && !bottomClipsBelow && !reverse) ||
				(!topClipsAbove && bottomClipsBelow && reverse)
			) {
				top = distanceToParentTop - offsets.top;
			} else if (
				(!topClipsAbove && bottomClipsBelow && !reverse) ||
				(topClipsAbove && !bottomClipsBelow && reverse)
			) {
				top =
					verticalParent.scrollHeight -
					verticalParent.clientHeight -
					distanceToParentBottom +
					offsets.bottom;
			}
		} else if (offsets.top !== undefined) {
			top = boundingRect.y - parentBoundingRect.y + verticalParent.scrollTop - offsets.top;
		} else if (offsets.bottom !== undefined) {
			top =
				boundingRect.y -
				parentBoundingRect.y +
				htmlElement.clientHeight +
				verticalParent.scrollTop +
				offsets.bottom -
				verticalParent.clientHeight;
		}

		if (top !== -1) {
			verticalParent.scrollTo({
				behavior: scrollBehavior,
				top
			});
		}
	}
	if (horizontalParent && (offsets.left !== undefined || offsets.right !== undefined)) {
		const parentBoundingRect = horizontalParent.getBoundingClientRect();

		let left = -1;

		if (offsets.left !== undefined && offsets.right !== undefined) {
			left =
				boundingRect.x - parentBoundingRect.x < offsets.left
					? boundingRect.x - parentBoundingRect.x + horizontalParent.scrollLeft - offsets.left
					: boundingRect.x - parentBoundingRect.x + htmlElement.clientWidth >
					  horizontalParent.clientWidth - offsets.right
					? boundingRect.x -
					  parentBoundingRect.x +
					  htmlElement.clientWidth +
					  horizontalParent.scrollLeft +
					  offsets.right -
					  horizontalParent.clientWidth
					: -1;
		} else if (offsets.left !== undefined) {
			left = boundingRect.x - parentBoundingRect.x + horizontalParent.scrollLeft - offsets.left;
		} else if (offsets.right !== undefined) {
			left =
				boundingRect.x -
				parentBoundingRect.x +
				htmlElement.clientWidth +
				horizontalParent.scrollLeft +
				offsets.right -
				horizontalParent.clientWidth;
		}

		if (left !== -1) {
			horizontalParent.scrollTo({
				behavior: scrollBehavior,
				left
			});
		}
	}
};

export const scrollIntoView: (...args: [Offsets]) => (e: CustomEvent<EnterEvent>) => void =
	(...args) =>
	(e) => {
		const element = e.detail.selectable.getHtmlElement();
		if (element) {
			scrollElementIntoView(element, ...args);
		}
	};

export const useRegistrar = (): { registrar: Registrar } & Readable<Selectable | undefined> => {
	const selectable = writable<Selectable | undefined>();

	const registrar: Registrar = (e) => {
		selectable.update((prev) => {
			if (prev) {
				console.warn('Overwriting existing selectable', prev, e.detail);
			}

			return e.detail;
		});

		return () => selectable.set(undefined);
	};

	return {
		registrar,
		subscribe: selectable.subscribe
	};
};

export const useRegistrars = <T extends string | number>(): {
	registrar: (key: T) => Registrar;
	get: (key: T) => Readable<Selectable | undefined>;
} => {
	const map = new Map<T, Writable<Selectable | undefined>>();

	const registrar =
		(key: T): Registrar =>
		(e) => {
			if (!map.has(key)) {
				map.set(key, writable<Selectable | undefined>());
			}

			const store = map.get(key);
			store?.update((prev) => {
				if (prev) {
					console.warn('Overwriting existing selectable', prev, e.detail);
				}

				return e.detail;
			});

			return () => store?.set(undefined);
		};

	const get = (key: T): Readable<Selectable | undefined> => {
		const store = map.get(key);
		if (!store) {
			const newStore = writable<Selectable | undefined>();
			map.set(key, newStore);
			return newStore;
		} else {
			return store;
		}
	};

	return {
		registrar,
		get
	};
};

const sidebar = useRegistrar();
const episodeCards = useRegistrar();

export const registrars = {
	sidebar: sidebar,
	seriesPage: {
		episodeCards
	}
};
