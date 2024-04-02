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

export type RevealStrategy = (target: Selectable) => void;

export const scrollWithOffset =
	(side: Direction | 'all' = 'all', offset = 50): RevealStrategy =>
	(target) => {
		function getScrollParent(node: HTMLElement): HTMLElement | undefined {
			const parent = node.parentElement;

			if (parent) {
				if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
					return parent;
				} else {
					return getScrollParent(parent);
				}
			}
		}

		// scrollIntoView(offset = 0, direction: Direction = 'left') {
		const targetHtmlElement = target.getHtmlElement();
		if (targetHtmlElement) {
			const boundingRect = targetHtmlElement.getBoundingClientRect();

			const leftOffset = targetHtmlElement.offsetLeft;
			const rightOffset = targetHtmlElement.offsetLeft + boundingRect.width;
			const topOffset = targetHtmlElement.offsetTop;
			const bottomOffset = targetHtmlElement.offsetTop + boundingRect.height;

			const offsetParent = getScrollParent(targetHtmlElement);

			if (offsetParent) {
				const parentBoundingRect = offsetParent.getBoundingClientRect();

				const scrollLeft = offsetParent.scrollLeft;
				const scrollRight =
					offsetParent.scrollLeft + Math.min(parentBoundingRect.width, window.innerWidth);
				const scrollTop = offsetParent.scrollTop;
				const scrollBottom =
					offsetParent.scrollTop + Math.min(parentBoundingRect.height, window.innerHeight);

				if (side === 'all') {
					const left =
						leftOffset - offset < scrollLeft
							? leftOffset - offset
							: rightOffset + offset > scrollRight
							? rightOffset - Math.min(parentBoundingRect.width, window.innerWidth) + offset
							: -1;
					const top =
						topOffset - offset < scrollTop
							? topOffset - offset
							: bottomOffset + offset > scrollBottom
							? bottomOffset - Math.min(parentBoundingRect.height, window.innerHeight) + offset
							: -1;

					if (left !== -1 || top !== -1) {
						offsetParent.scrollTo({
							...(left !== -1 && { left }),
							...(top !== -1 && { top }),
							behavior: 'smooth'
						});
					}
				} else if (side === 'left' || side === 'right') {
					const left = {
						left: leftOffset - offset,
						right: rightOffset - parentBoundingRect.width + offset
					}[side];

					offsetParent.scrollTo({
						left,
						behavior: 'smooth'
					});
				} else if (side === 'up' || side === 'down') {
					const top = {
						up: topOffset - offset,
						down: bottomOffset - parentBoundingRect.height + offset
					}[side];

					offsetParent.scrollTo({
						top,
						behavior: 'smooth'
					});
				}
			}
		}
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
	private canFocusEmpty: boolean = true;
	private trapFocus: boolean = false;
	private isInitialized: boolean = false;
	private navigationActions: NavigationActions = {};
	private isActive: boolean = true;
	private scrollIntoView?: RevealStrategy;
	private scrollChildrenIntoView?: RevealStrategy;

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

		if (!get(this.hasFocusWithin)) {
			if (this.scrollIntoView) this.scrollIntoView(this);
			else if (this.parent?.getScrollChildrenIntoView())
				this.parent?.getScrollChildrenIntoView()?.(this);
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
			// this.scrollIntoView(50);
			Selectable.focusedObject.set(this);
			updateFocusIndex(this);
		}
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

	getHtmlElement() {
		return this.htmlElement;
	}

	setRevealStrategy(revealStrategy?: RevealStrategy) {
		this.scrollIntoView = revealStrategy;
		return this;
	}

	setChildrenRevealStrategy(revealStrategy?: RevealStrategy) {
		this.scrollChildrenIntoView = revealStrategy;
		return this;
	}

	getScrollChildrenIntoView() {
		return this.scrollChildrenIntoView;
	}

	setTrapFocus(trapFocus: boolean) {
		this.trapFocus = trapFocus;
		return this;
	}

	setCanFocusEmpty(canFocusEmpty: boolean) {
		this.canFocusEmpty = canFocusEmpty;
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
