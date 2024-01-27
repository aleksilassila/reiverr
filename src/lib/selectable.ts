import { derived, get, type Readable, type Writable, writable } from 'svelte/store';

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';

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

	private direction: FlowDirection = 'vertical';

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
		if (this.children.length > 0) {
			this.children[get(this.focusIndex)]?.focus();
		} else if (this.htmlElement) {
			this.htmlElement.focus({ preventScroll: true });
			this.htmlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
			Selectable.focusedObject.set(this);
			this.updateFocusIndex();
		}
	}

	updateFocusIndex(selectable?: Selectable) {
		if (selectable) {
			const index = this.children.indexOf(selectable);
			this.focusIndex.update((prev) => (index === -1 ? prev : index));
		}
		if (this.parent) {
			this.parent.updateFocusIndex(this);
		}
	}

	isFocusable() {
		if (this.htmlElement) {
			return this.htmlElement.tabIndex >= 0;
		} else {
			for (const child of this.children) {
				if (child.isFocusable()) {
					return true;
				}
			}
		}
	}

	getFocusableNeighbor(direction: Direction): Selectable | undefined {
		const canLoop =
			(this.direction === 'vertical' &&
				((direction === 'up' && get(this.focusIndex) !== 0) ||
					(direction === 'down' && get(this.focusIndex) !== this.children.length - 1))) ||
			(this.direction === 'horizontal' &&
				((direction === 'left' && get(this.focusIndex) !== 0) ||
					(direction === 'right' && get(this.focusIndex) !== this.children.length - 1)));

		if (this.children.length > 0 && canLoop) {
			if (direction === 'up' || direction === 'left') {
				let index = get(this.focusIndex) - 1;
				while (index >= 0) {
					if (this.children[index].isFocusable()) {
						return this.children[index];
					}
					index--;
				}
			} else if (direction === 'down' || direction === 'right') {
				let index = get(this.focusIndex) + 1;
				while (index < this.children.length) {
					if (this.children[index].isFocusable()) {
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

		console.log('Initializing', this.htmlElement);

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
			console.log('Registering', htmlElement, selectable);
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

	// console.log('Currently focused object: ', currentlyFocusedObject.name, currentlyFocusedObject);

	if (event.key === 'ArrowUp') {
		if (Selectable.focusUp()) event.preventDefault();
	} else if (event.key === 'ArrowDown') {
		if (Selectable.focusDown()) event.preventDefault();
	} else if (event.key === 'ArrowLeft') {
		if (Selectable.focusLeft()) event.preventDefault();
	} else if (event.key === 'ArrowRight') {
		if (Selectable.focusRight()) event.preventDefault();
	}
}
