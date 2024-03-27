import { derived, get, type Readable, type Writable, writable } from 'svelte/store';

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';
export type NavigationActions = {
	[direction in Direction]?: (selectable: Selectable) => boolean;
} & {
	back?: (selectable: Selectable) => boolean;
	enter?: (selectable: Selectable) => boolean;
};

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
	private isInitialized: boolean = false;
	private navigationActions: NavigationActions = {};
	private isActive: boolean = true;

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

	focus() {
		function updateFocusIndex(currentSelectable: Selectable, selectable?: Selectable) {
			if (selectable) {
				const index = currentSelectable.children.indexOf(selectable);
				currentSelectable.focusIndex.update((prev) => (index === -1 ? prev : index));
			}
			if (currentSelectable.parent) {
				updateFocusIndex(currentSelectable.parent, currentSelectable);
			}
		}

		if (this.children.length > 0) {
			const focusIndex = get(this.focusIndex);

			if (this.children[focusIndex]?.isFocusable()) {
				this.children[focusIndex]?.focus();
			} else {
				let i = focusIndex;
				while (i < this.children.length) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus();
						return;
					}
					i++;
				}
				i = focusIndex - 1;
				while (i >= 0) {
					if (this.children[i]?.isFocusable()) {
						this.children[i]?.focus();
						return;
					}
					i--;
				}
			}
		} else if (this.htmlElement) {
			this.htmlElement.focus({ preventScroll: true });
			// this.htmlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
			this.scrollIntoView(50);
			Selectable.focusedObject.set(this);
			updateFocusIndex(this);
		}
	}

	scrollIntoView(offset = 0, direction: Direction = 'left') {
		if (this.htmlElement) {
			const boundingRect = this.htmlElement.getBoundingClientRect();
			const offsetParent = this.htmlElement.offsetParent as HTMLElement;

			if (offsetParent) {
				const left = this.htmlElement.offsetLeft - offset;

				// console.log(boundingRect);
				// console.log('Scrolling to left: ', left);
				offsetParent.scrollTo({
					left,
					behavior: 'smooth'
				});
			}
		}
	}

	/**
	 * @returns {boolean} whether the selectable is focusable
	 */
	isFocusable(): boolean {
		if (!this.isActive) return false;

		if (this.htmlElement) {
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

	// TODO: Clean this up
	getFocusableNeighbor(direction: Direction): Selectable | undefined {
		const focusIndex = get(this.focusIndex);
		const isGrid = this.gridColumns > 0;

		const canCycleSiblings =
			(this.direction === 'vertical' &&
				((direction === 'up' && focusIndex !== 0) ||
					(direction === 'down' && focusIndex !== this.children.length - 1))) ||
			(this.direction === 'horizontal' &&
				((direction === 'left' && focusIndex !== 0) ||
					(direction === 'right' && focusIndex !== this.children.length - 1))) ||
			(isGrid &&
				this.direction === 'horizontal' &&
				((direction === 'up' && focusIndex >= this.gridColumns) ||
					(direction === 'down' && focusIndex < this.children.length - this.gridColumns)));

		if (this.children.length > 0 && canCycleSiblings) {
			if (isGrid && direction === 'up') {
				let index = focusIndex - this.gridColumns;
				while (index >= 0) {
					if (this.children[index]?.isFocusable()) {
						return this.children[index];
					}
					index -= this.gridColumns;
				}
			} else if (isGrid && direction === 'down') {
				let index = focusIndex + this.gridColumns;
				while (index < this.children.length) {
					if (this.children[index]?.isFocusable()) {
						return this.children[index];
					}
					index += this.gridColumns;
				}
			}

			if (direction === 'up' || direction === 'left') {
				let index = focusIndex - 1;
				while (index >= 0) {
					if (this.children[index]?.isFocusable()) {
						return this.children[index];
					}
					index--;
				}
			} else if (direction === 'down' || direction === 'right') {
				let index = focusIndex + 1;
				while (index < this.children.length) {
					if (this.children[index]?.isFocusable()) {
						return this.children[index];
					}
					index++;
				}
			}
		} else if (this.neighbors[direction]?.isFocusable()) {
			return this.neighbors[direction];
		} else {
			return this.parent?.getFocusableNeighbor(direction);
		}

		console.warn('How did we end up here');
	}

	private giveFocus(direction: Direction) {
		const neighbor = this.getFocusableNeighbor(direction);
		if (neighbor) {
			neighbor.focus();
			return true;
		} else {
			return false;
		}
	}

	static focusUp() {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus('up');
	}

	static focusDown() {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus('down');
	}

	static focusLeft() {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus('left');
	}

	static focusRight() {
		const currentlyFocusedObject = get(Selectable.focusedObject);
		return currentlyFocusedObject?.giveFocus('right');
	}

	_initializeSelectable() {
		const getParentSelectable = (htmlElement: HTMLElement): Selectable | undefined => {
			if (Selectable.objects.get(htmlElement)) return Selectable.objects.get(htmlElement);
			else if (htmlElement.parentElement) return getParentSelectable(htmlElement.parentElement);
			else return undefined;
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
			parentSelectable.addChild(this);
		} else {
			console.error('No parent selectable found for', this.htmlElement);
		}

		if (!get(Selectable.focusedObject) && this.shouldFocusByDefault()) {
			this.focus();
		}
	}

	_unmountContainer() {
		// console.log('Unmounting selectable', this);
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

	private addChild(child: Selectable) {
		this.children.push(child);
		child.parent = this;
		return this;
	}

	private removeChild(child: Selectable) {
		if (this.children.indexOf(child) < get(this.focusIndex)) {
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
		if (navigationActions.up && navigationActions.up(currentlyFocusedObject))
			event.preventDefault();
		else if (Selectable.focusUp()) event.preventDefault();
	} else if (event.key === 'ArrowDown') {
		if (navigationActions.down && navigationActions.down(currentlyFocusedObject))
			event.preventDefault();
		else if (Selectable.focusDown()) event.preventDefault();
	} else if (event.key === 'ArrowLeft') {
		if (navigationActions.left && navigationActions.left(currentlyFocusedObject))
			event.preventDefault();
		else if (Selectable.focusLeft()) event.preventDefault();
	} else if (event.key === 'ArrowRight') {
		if (navigationActions.right && navigationActions.right(currentlyFocusedObject))
			event.preventDefault();
		else if (Selectable.focusRight()) event.preventDefault();
	} else if (event.key === 'Enter') {
		if (navigationActions.enter && navigationActions.enter(currentlyFocusedObject))
			event.preventDefault();
		else currentlyFocusedObject.click();
	}
}