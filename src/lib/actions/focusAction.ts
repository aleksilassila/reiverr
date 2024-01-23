import { derived, get, type Readable, type Writable, writable } from 'svelte/store';

export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };

export type Direction = 'up' | 'down' | 'left' | 'right';
export type FlowDirection = 'vertical' | 'horizontal';

export class Container {
	id: symbol;
	name: string;
	private parent?: Container;
	private children: Container[] = [];
	private htmlElement?: HTMLElement;
	private neighbors: Record<Direction, Container | undefined> = {
		up: undefined,
		down: undefined,
		left: undefined,
		right: undefined
	};
	private focusByDefault: boolean = false;
	private isInitialized: boolean = false;

	private direction: FlowDirection = 'vertical';

	static focusedObject: Writable<Container | undefined> = writable(undefined);

	focusIndex: Writable<number> = writable(0);
	hasFocus: Readable<boolean> = derived(Container.focusedObject, ($focusedObject) => {
		console.log('Updating hasFocus', $focusedObject, this);
		return $focusedObject === this;
	});
	hasFocusWithin: Readable<boolean> = derived(Container.focusedObject, ($focusedObject) => {
		let currentContainer: Container | undefined = $focusedObject;

		while (currentContainer) {
			if (currentContainer === this) {
				return true;
			}
			currentContainer = currentContainer.parent;
		}

		return false;
	});

	static objects = new Map<HTMLElement, Container>();

	constructor(name: string = '') {
		this.id = Symbol();
		this.name = name;

		// Find parents
	}

	setDirection(direction: FlowDirection) {
		this.direction = direction;
		return this;
	}

	setFocusByDefault(focusByDefault: boolean) {
		this.focusByDefault = focusByDefault;
		return this;
	}

	setHtmlElement(htmlElement: HTMLElement) {
		this.htmlElement = htmlElement;
		Container.objects.set(htmlElement, this);
		return this;
	}

	// createChild(htmlElement: HTMLElement, name: string = '') {
	// 	const child = new Container(htmlElement, name);
	// 	this.addChild(child);
	// 	return child;
	// }

	focus() {
		if (this.children.length > 0) {
			this.children[get(this.focusIndex)]?.focus();
		} else if (this.htmlElement) {
			this.htmlElement.focus({ preventScroll: true });
			this.htmlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
			Container.focusedObject.set(this);
			this.updateFocusIndex();
		}
	}

	updateFocusIndex(container?: Container) {
		if (container) {
			const index = this.children.indexOf(container);
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

	getFocusableNeighbor(direction: Direction): Container | undefined {
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
	}

	giveFocus(direction: Direction) {
		const neighbor = this.getFocusableNeighbor(direction);
		// console.log('Giving focus to', direction, 'neighbor: ', neighbor?.name, neighbor);
		if (neighbor) {
			neighbor.focus();
			return true;
		} else {
			return false;
		}
	}

	// getChildRegisterer(): Registerer {
	// 	return (htmlElement: HTMLElement) => {
	// 		if (this.htmlElement) console.warn('Registering to a container that has an element.');
	//
	// 		this.createChild().addHtmlElement(htmlElement);
	//
	// 		if (!get(Container.focusedObject) && this.shouldFocusByDefault()) {
	// 			this.focus();
	// 		}
	//
	// 		return {
	// 			destroy: () => {
	// 				this.removeHtmlElement();
	// 			}
	// 		};
	// 	};
	// }
	//
	// getHtmlElementRegisterer(): Registerer {
	// 	return (htmlElement: HTMLElement) => {
	// 		if (this.children.length > 0) {
	// 			console.warn('Registering an html element to a container that has children.');
	// 			for (const child of this.children) {
	// 				this.removeChild(child);
	// 			}
	// 		}
	// 		this.addHtmlElement(htmlElement);
	// 		return {
	// 			destroy: () => {
	// 				this.removeHtmlElement();
	// 			}
	// 		};
	// 	};
	// }

	_initializeContainer() {
		const getParentContainer = (htmlElement: HTMLElement): Container | undefined => {
			if (Container.objects.get(htmlElement)) return Container.objects.get(htmlElement);
			else if (htmlElement.parentElement) return getParentContainer(htmlElement.parentElement);
			else return undefined;
		};

		if (!this.htmlElement) {
			console.error('No html element found for', this);
			return;
		} else if (this.isInitialized) {
			console.warn('Container already initialized', this);
		}

		const parentContainer = this.htmlElement.parentElement
			? getParentContainer(this.htmlElement.parentElement)
			: undefined;
		if (parentContainer) {
			parentContainer.addChild(this);
		} else {
			console.error('No parent container found for', this.htmlElement);
		}

		if (!get(Container.focusedObject) && this.shouldFocusByDefault()) {
			this.focus();
		}
	}

	_unmountContainer() {
		console.log('Unmounting container', this);
		const isFocusedWithin = get(this.hasFocusWithin);

		if (this.htmlElement) {
			Container.objects.delete(this.htmlElement);
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
		_container?: Container,
		flowDirection: FlowDirection = 'vertical'
	): Registerer {
		const container = _container || new Container().setDirection(flowDirection);

		return (htmlElement: HTMLElement) => {
			console.log('Registering', htmlElement, container);
			container.setHtmlElement(htmlElement);

			return {
				destroy: () => {
					container.parent?.removeChild(container);
					Container.objects.delete(htmlElement);
				}
			};
		};
	}

	static getRegisterer(flowDirection: FlowDirection = 'vertical'): Registerer {
		return (htmlElement: HTMLElement) =>
			this.createRegisterer(undefined, flowDirection)(htmlElement);
	}

	getRegisterer(): Registerer {
		return (htmlElement: HTMLElement) => Container.createRegisterer(this)(htmlElement);
	}

	static getStores(element: HTMLElement) {
		return Container.objects.get(element)?.getStores();
	}

	getStores(): {
		container: Container;
		hasFocus: Readable<boolean>;
		hasFocusWithin: Readable<boolean>;
		registerer: Registerer;
	} {
		return {
			container: this,
			hasFocus: this.hasFocus,
			hasFocusWithin: this.hasFocusWithin,
			registerer: this.getRegisterer()
		};
	}

	private addChild(child: Container) {
		this.children.push(child);
		child.parent = this;
		return this;
	}

	private removeChild(child: Container) {
		this.children = this.children.filter((c) => c !== child);
		child.parent = undefined;
		return this;
	}

	// private addHtmlElement(htmlElement: HTMLElement) {
	// 	if (this.children.length > 0) {
	// 		console.warn('Adding an html element to a container that has children.');
	// 		for (const child of this.children) {
	// 			this.removeChild(child);
	// 		}
	// 	}
	// 	this.htmlElement = htmlElement;
	// 	return this;
	// }

	private shouldFocusByDefault(): boolean {
		return this.focusByDefault || this.parent?.shouldFocusByDefault() || false;
	}
}

export function handleKeyboardNavigation(event: KeyboardEvent) {
	const currentlyFocusedObject = get(Container.focusedObject);

	if (!currentlyFocusedObject) {
		console.error('No focused object!!!');
		// Find object that can be focused
		Container.objects.forEach((container) => {
			if (container.isFocusable()) {
				container.focus();
			}
		});
		return;
	}

	// console.log('Currently focused object: ', currentlyFocusedObject.name, currentlyFocusedObject);

	if (event.key === 'ArrowUp') {
		if (currentlyFocusedObject.giveFocus('up')) event.preventDefault();
	} else if (event.key === 'ArrowDown') {
		if (currentlyFocusedObject.giveFocus('down')) event.preventDefault();
	} else if (event.key === 'ArrowLeft') {
		if (currentlyFocusedObject.giveFocus('left')) event.preventDefault();
	} else if (event.key === 'ArrowRight') {
		if (currentlyFocusedObject.giveFocus('right')) event.preventDefault();
	}
}

export const focusedObject = Container.focusedObject;
// export const mainContainer = new Container('main')
// 	.setDirection('horizontal')
// 	.setFocusByDefault(true);

export const registerer = Container.getRegisterer();
