import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { getScrollParent } from './utils';

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';
export type NavigationActions = {
	[direction in Direction]?: (selectable: Selectable) => boolean;
} & {
	back?: (selectable: Selectable) => boolean;
	enter?: (selectable: Selectable) => boolean;
};

type FocusHandlerOptions = {
	setFocusedElement: boolean;
	propagate: boolean;
	stopPropagation: () => void;
};

const createFocusHandlerOptions = (): FocusHandlerOptions => {
	const options: Partial<FocusHandlerOptions> = {
		setFocusedElement: true,
		propagate: true
	};

	options.stopPropagation = () => {
		options.propagate = false;
	};

	return options as FocusHandlerOptions;
};
export type FocusHandler = (selectable: Selectable, options: FocusHandlerOptions) => void;

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
	private focusByDefault: boolean = false;
	private canFocusEmpty: boolean = true;
	private trapFocus: boolean = false;
	private isInitialized: boolean = false;
	private navigationActions: NavigationActions = {};
	private isActive: boolean = true;
	private onFocus?: FocusHandler;

	private direction: FlowDirection = 'vertical';
	private gridColumns: number = 0;

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

		// Find parents
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

	focus(options: Partial<FocusHandlerOptions> = {}) {
		function propagateFocusUpdates(
			options: FocusHandlerOptions,
			parent: Selectable,
			child?: Selectable
		) {
			if (!get(parent.hasFocusWithin) && options.propagate) parent.onFocus?.(parent, options);

			if (child) {
				const index = parent.children.indexOf(child);
				parent.focusIndex.update((prev) => (index === -1 ? prev : index));
			}
			if (parent.parent) {
				propagateFocusUpdates(options, parent.parent, parent);
			}
		}

		if (this.children.length > 0) {
			const focusIndex = get(this.focusIndex);

			if (this.children[focusIndex]?.isFocusable()) {
				this.children[focusIndex]?.focus(options);
			} else {
				let i = focusIndex;
				while (i < this.children.length) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus(options);
						// this.onFocus?.(this);
						return;
					}
					i++;
				}
				i = focusIndex - 1;
				while (i >= 0) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus(options);
						// this.onFocus?.(this);
						return;
					}
					i--;
				}
			}
		} else if (this.htmlElement) {
			const _options: FocusHandlerOptions = {
				...createFocusHandlerOptions(),
				...options
			};
			propagateFocusUpdates(_options, this);

			if (_options.setFocusedElement) {
				this.htmlElement.focus({ preventScroll: true });
				Selectable.focusedObject.set(this);
			}
		}
	}

	focusChildren(index: number, options?: Partial<FocusHandlerOptions>): boolean {
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
	isFocusable(): boolean {
		if (!this.isActive) return false;

		if (this.htmlElement && this.canFocusEmpty) {
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

	private giveFocus(direction: Direction, bypassActions: boolean = false): boolean {
		const focusIndex = get(this.focusIndex);

		const indexAddition = {
			up: this.direction === 'vertical' ? -1 : -this.gridColumns,
			down: this.direction === 'vertical' ? 1 : this.gridColumns,
			left:
				this.direction === 'horizontal'
					? (focusIndex % this.gridColumns) - 1 < 0
						? 0
						: -1
					: -this.gridColumns,
			right:
				this.direction === 'horizontal'
					? (focusIndex % this.gridColumns) + 1 >= this.gridColumns
						? 0
						: 1
					: this.gridColumns
		}[direction];

		// Cycle siblings
		if (indexAddition !== 0) {
			let index = focusIndex + indexAddition;
			while (index >= 0 && index < this.children.length) {
				const children = this.children[index];
				if (children && children.isFocusable()) {
					children.focus();
					return true;
				}
				index += indexAddition;
			}
		}

		// About to leave this container (=coulnd't cycle siblings)

		const action = this.navigationActions[direction];
		if (action && !bypassActions && action(this)) {
			return true;
		} else if (this.neighbors[direction]?.isFocusable()) {
			this.neighbors[direction]?.focus();
			return true;
		} else if (!this.trapFocus) {
			return this.parent?.giveFocus(direction, bypassActions) || false;
		}

		return false;
	}

	static giveFocus(direction: Direction, bypassActions: boolean = false) {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus(direction, bypassActions);
	}

	_initializeSelectable() {
		const getParentSelectable = (htmlElement: HTMLElement): Selectable | undefined => {
			if (Selectable.objects.get(htmlElement)) return Selectable.objects.get(htmlElement);
			else if (htmlElement.parentElement) return getParentSelectable(htmlElement.parentElement);
			else return undefined;
		};

		const getSiblingSelectable = (parent: Selectable): Selectable | undefined => {
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

			if (!this.htmlElement) return undefined;

			const parentHtmlElement = parent.htmlElement;

			if (!parentHtmlElement) return undefined;

			const thisElementTree = getElementTree(this.htmlElement, parentHtmlElement);

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

		if (!this.htmlElement) {
			console.error('No html element found for', this);
			return;
		} else if (this.isInitialized) {
			console.warn('Selectable already initialized', this);
		}

		// console.log('Initializing', this.htmlElement);

		const parentSelectable = this.htmlElement.parentElement
			? getParentSelectable(this.htmlElement.parentElement)
			: undefined;
		if (parentSelectable) {
			const aboveSibling = getSiblingSelectable(parentSelectable);
			const index = aboveSibling ? parentSelectable.children.indexOf(aboveSibling) : undefined;
			parentSelectable.addChild(this, index === undefined ? 0 : index + 1);
		} else {
			console.error('No parent selectable found for', this.htmlElement);
		}

		if (!get(Selectable.focusedObject) && this.shouldFocusByDefault()) {
			this.focus();
		}
	}

	_unmountContainer() {
		console.log('Unmounting selectable', this);
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

	private static createRegisterer(
		_selectable?: Selectable,
		flowDirection: FlowDirection = 'vertical'
	): Registerer {
		const selectable = _selectable || new Selectable().setDirection(flowDirection);

		return (htmlElement: HTMLElement) => {
			// console.log('Registering', htmlElement, selectable);
			selectable.setHtmlElement(htmlElement);

			return {
				destroy: () => {
					selectable.parent?.removeChild(selectable);
					Selectable.objects.delete(htmlElement);
					console.log('destroying', htmlElement, selectable);
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

	private addChild(child: Selectable, index?: number) {
		if (index !== undefined) {
			const parentFocusWithin = child.parent?.hasFocusWithin && get(child.parent?.hasFocusWithin);
			if (parentFocusWithin && this.children.length && index <= get(this.focusIndex)) {
				this.focusIndex.update((prev) => prev + 1);
			}
			this.children.splice(index, 0, child);
		} else {
			this.children.push(child);
		}

		child.parent = this;
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

	private shouldFocusByDefault(): boolean {
		return this.focusByDefault || this.parent?.shouldFocusByDefault() || false;
	}

	click() {
		if (this.htmlElement) {
			this.htmlElement.click();
		}
	}

	getFocusedChild() {
		return this.children[get(this.focusIndex)];
	}

	setNavigationActions(actions: NavigationActions) {
		this.navigationActions = actions;
		return this;
	}

	getNavigationActions(): NavigationActions {
		return this.navigationActions;
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

	const navigationActions = currentlyFocusedObject.getNavigationActions();
	if (event.key === 'ArrowUp') {
		if (Selectable.giveFocus('up')) event.preventDefault();
	} else if (event.key === 'ArrowDown') {
		if (Selectable.giveFocus('down')) event.preventDefault();
	} else if (event.key === 'ArrowLeft') {
		if (Selectable.giveFocus('left')) event.preventDefault();
	} else if (event.key === 'ArrowRight') {
		if (Selectable.giveFocus('right')) event.preventDefault();
	} else if (event.key === 'Enter') {
		if (navigationActions.enter && navigationActions.enter(currentlyFocusedObject))
			event.preventDefault();
		else currentlyFocusedObject.click();
	}
}

// Selectable.focusedObject.subscribe(console.log);

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
				behavior: 'smooth',
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
				behavior: 'smooth',
				left
			});
		}
	}
};

export const scrollIntoView: (...args: [Offsets]) => (s: Selectable) => void =
	(...args) =>
	(s) => {
		const element = s.getHtmlElement();
		if (element) {
			scrollElementIntoView(element, ...args);
		}
	};
