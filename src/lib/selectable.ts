import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { getScrollParent } from './utils';
import { localSettings } from './stores/localstorage.store';

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };
export type Registrar = (e: CustomEvent<Selectable>) => () => void;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';

type FocusEventOptions = {
	setFocusedElement: boolean | HTMLElement;
	propagate: boolean;
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

export class Selectable {
	id: symbol;
	name: string;
	private parent?: Selectable;
	private children: Selectable[] = [];
	private htmlElement?: HTMLElement;
	private neighbors: Record<Direction, Selectable | undefined> = {
		up: undefined,
		down: undefined,
		left: undefined,
		right: undefined
	};
	private canFocusEmpty: boolean = true;
	private trapFocus: boolean = false;
	private isActive: boolean = true;

	private onNavigate: NavigationHandler = () => {};
	private onFocus: FocusHandler = () => {};
	private onBack: KeyEventHandler = () => {};
	private onPlayPause: KeyEventHandler = () => {};
	private onSelect?: () => void;

	private direction: FlowDirection = 'vertical';
	private gridColumns: number = 0;

	private static _initializationStack: Selectable[] = [];

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

	static objects = new Map<HTMLElement, Selectable>();

	constructor(name: string = '') {
		this.id = Symbol();
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
				const updateParentFocusIndex = options.setFocusedElement
					? true
					: !get(parent?.hasFocusWithin);
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
	 * @returns {boolean} whether the selectable is focusable
	 */
	isFocusable(canFocusEmpty = this.canFocusEmpty): boolean {
		// TODO: CLEAN UP
		if (!this.isActive) return false;
		if (this.htmlElement && canFocusEmpty) {
			return this.htmlElement.tabIndex >= 0;
		} else {
			for (const child of this.children) {
				if (child.isFocusable()) {
					return true;
				}
			}
		}

		return false;
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
				let index = focusIndex + indexAddition;
				while (index >= 0 && index < selectable.children.length) {
					const child = selectable.children[index];
					if (child && child.isFocusable()) {
						return { target: child, cycledParent: selectable };
					}
					index += indexAddition;
				}
			}

			if (selectable.neighbors[direction]?.isFocusable()) {
				return { target: selectable.neighbors[direction] };
				// return selectable.neighbors[direction];
			} else if (!selectable.trapFocus) {
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
						selectable.addChild(potentialChild, 0);
						Selectable._initializationStack.splice(j, 1);
						i = j;
					} else break;
				}
			}
		}
	}

	/**
	 * TODO: Add docs
	 */
	private static finalizeTreeStructure() {
		const getParentSelectable = (htmlElement: HTMLElement): Selectable | undefined => {
			if (Selectable.objects.get(htmlElement)) return Selectable.objects.get(htmlElement);
			else if (htmlElement.parentElement) return getParentSelectable(htmlElement.parentElement);
			else return undefined;
		};

		const getSiblingSelectable = (
			parent: Selectable,
			child: Selectable
		): Selectable | undefined => {
			const getElementTree = (start: HTMLElement, end: HTMLElement): HTMLElement[] => {
				let element = start;
				const elements: HTMLElement[] = [start];

				while (element !== end) {
					if (element.parentElement) element = element.parentElement;
					else break;
					elements.push(element);
				}

				return elements;
			};

			const htmlElement = child.htmlElement;
			if (!htmlElement) return undefined;

			const parentHtmlElement = parent.htmlElement;

			if (!parentHtmlElement) return undefined;

			const thisElementTree = getElementTree(htmlElement, parentHtmlElement);

			let aboveSibling: Selectable | undefined = undefined;

			for (const existingSibling of parent.children) {
				// Does not contain this yet
				if (!existingSibling.htmlElement) {
					console.error('No html element found for', existingSibling);
					continue;
				}
				const siblingElementTree: HTMLElement[] = getElementTree(
					existingSibling.htmlElement,
					parentHtmlElement
				);

				const commonParentElement = thisElementTree.find((element) =>
					siblingElementTree.includes(element)
				);
				const thisSibling = thisElementTree.find(
					(element) => element.parentElement && siblingElementTree.includes(element.parentElement)
				);
				const targetSibling = siblingElementTree.find(
					(element) => element.parentElement && thisElementTree.includes(element.parentElement)
				);
				if (!thisSibling || !targetSibling || !commonParentElement) {
					console.warn(
						"Couldn't find common parent element",
						thisSibling,
						targetSibling,
						commonParentElement
					);
					continue;
				}
				const allSiblingElements = Array.from(commonParentElement.children);

				if (allSiblingElements.indexOf(targetSibling) < allSiblingElements.indexOf(thisSibling)) {
					aboveSibling = existingSibling;
				} else break;
			}

			return aboveSibling;
		};

		for (const child of this._initializationStack) {
			const htmlElement = child.htmlElement;
			const parentSelectable = htmlElement?.parentElement
				? getParentSelectable(htmlElement.parentElement)
				: undefined;

			if (parentSelectable) {
				const aboveSibling = getSiblingSelectable(parentSelectable, child);
				const index = aboveSibling ? parentSelectable.children.indexOf(aboveSibling) : undefined;
				parentSelectable.addChild(child, index === undefined ? 0 : index + 1);
				console.debug('Attached child tree to parent', child, parentSelectable);
			} else {
				console.warn('Could not attach child (probably root)', child);
				child.focus();
			}
		}

		Selectable._initializationStack = [];
	}

	/** TODO update docs
	 * This runs after the regsterer has been called and the htmlElement
	 * has been set. Becasue all the children get initialized before their parents,
	 * we can't create the parent-child tree structure in the registerer but instead
	 * have to wait until every element has htmlElement and then later (here) deduce
	 * the parent-child relationships.
	 */
	_mountSelectable(focusOnMount: boolean = false) {
		console.debug('Mounting', this, Selectable._initializationStack.slice());

		Selectable.finalizeTreeStructure();

		if (!get(this.hasFocusWithin) && this.isFocusable(true) && focusOnMount) {
			this.focus(); // TODO: CLEAN UP
		}

		if (!this.htmlElement) {
			console.error('No html element found for', this);
			return;
		}
	}

	_unmountContainer() {
		const isFocusedWithin = get(this.hasFocusWithin);

		if (this.htmlElement) {
			Selectable.objects.delete(this.htmlElement);
		}

		const parent = this.parent;
		if (parent) {
			parent.removeChild(this);
			if (isFocusedWithin) {
				parent.focus();
			}
		}
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
			console.debug('Registering', selectable);
			Selectable._initializationStack.push(selectable);
			Selectable.initializeTreeStructure();

			return {
				destroy: () => {
					selectable.parent?.removeChild(selectable);
					Selectable.objects.delete(htmlElement);
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
	} {
		return {
			container: this,
			hasFocus: this.hasFocus,
			hasFocusWithin: this.hasFocusWithin,
			registerer: this.getRegisterer(),
			focusIndex: this.focusIndex
		};
	}

	/**
	 * TODO: Adding children to focusIndex does not modify focusIndex.
	 */
	private addChild(child: Selectable, index?: number) {
		if (child === this) {
			console.error('TRYING TO ADD SELF AS A CHILD', this);
			return;
		}

		const firstChild = this.children.length === 0;

		if (index !== undefined) {
			if (this.children.length && index < get(this.focusIndex)) {
				this.focusIndex.update((prev) => prev + 1);
			}
			this.children.splice(index, 0, child);
		} else {
			this.children.push(child);
		}

		child.parent = this;

		// TODO: CLEAN UP
		if (index === get(this.focusIndex) && get(this.hasFocusWithin)) {
			child.focus();
		}

		// 1. If parent has focus but also has child(ren), focus the child instead
		// 2. If adding to container that doesn't have focus because being empty
		// prevented receiving it, check if 1. applies to the parent

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let el: Selectable = this;
		while (firstChild) {
			if (get(el.hasFocus) && el.children.length) {
				el.focus();
				break;
			}

			if (!el.canFocusEmpty && el.parent) {
				el = el.parent;
			} else {
				break;
			}
		}

		return this;
	}

	private removeChild(child: Selectable) {
		if (this.children.indexOf(child) <= get(this.focusIndex)) {
			this.focusIndex.update((prev) => prev - 1);
		}

		this.children = this.children.filter((c) => c !== child);
		child.parent = undefined;
		return this;
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

	setIsActive(isActive: boolean) {
		this.isActive = isActive;
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

	setCanFocusEmpty(canFocusEmpty: boolean) {
		this.canFocusEmpty = canFocusEmpty;
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
	} else if (event.key === 'Back' || event.key === 'XF86Back') {
		currentlyFocusedObject.back();
	} else if (event.key === 'MediaPlayPause') {
		currentlyFocusedObject.playPause();
	} else {
		return;
	}

	event.preventDefault();
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
			top =
				boundingRect.y - parentBoundingRect.y < offsets.top
					? boundingRect.y - parentBoundingRect.y + verticalParent.scrollTop - offsets.top
					: boundingRect.y - parentBoundingRect.y + htmlElement.clientHeight >
					  verticalParent.clientHeight - offsets.bottom
					? boundingRect.y -
					  parentBoundingRect.y +
					  htmlElement.clientHeight +
					  verticalParent.scrollTop +
					  offsets.bottom -
					  verticalParent.clientHeight
					: -1;
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
