export class Container {
	id: symbol;
	name: string;
	parent?: Container;
	htmlElements: HTMLElement[] = [];
	private upNeighbor?: Container;
	private downNeighbor?: Container;
	private leftNeighbor?: Container;
	private rightNeighbor?: Container;

	direction: 'horizontal' | 'vertical' = 'horizontal';

	focusIndex: number = 0;

	static focusedObject: Container;
	static objects = new Map<symbol, Container>();

	constructor(name: string = '') {
		this.id = Symbol();
		this.name = name;
		Container.objects.set(this.id, this);

		if (!Container.focusedObject) {
			Container.focusedObject = this;
		}
	}

	getRegisterer() {
		return (htmlElement: HTMLElement) => {
			this.addHtmlElement(htmlElement);

			return {
				destroy: () => {
					this.removeHtmlElement(htmlElement);
				}
			};
		};
	}

	giveFocus(direction: 'up' | 'down' | 'left' | 'right') {
		const shouldCycle =
			this.direction === 'horizontal'
				? (direction === 'left' && this.focusIndex !== 0) ||
				  (direction === 'right' && this.focusIndex !== this.htmlElements.length - 1)
				: (direction === 'up' && this.focusIndex !== 0) ||
				  (direction === 'down' && this.focusIndex !== this.htmlElements.length - 1);

		if (shouldCycle) {
			console.log('Cycling through', this.htmlElements);
			if (direction === 'up') {
				this.focusIndex--;
			} else if (direction === 'down') {
				this.focusIndex++;
			} else if (direction === 'left') {
				this.focusIndex--;
			} else if (direction === 'right') {
				this.focusIndex++;
			}
			this.focusElement();
		} else {
			console.log("Giving focus to neighbor's", direction, 'neighbor');
			const upNeighbor = this.getUpNeighbor();
			const downNeighbor = this.getDownNeighbor();
			const leftNeighbor = this.getLeftNeighbor();
			const rightNeighbor = this.getRightNeighbor();
			if (direction === 'up' && upNeighbor) {
				if (upNeighbor.direction === 'vertical')
					upNeighbor.focusIndex = upNeighbor.htmlElements.length - 1;

				Container.focusedObject = upNeighbor;
				upNeighbor.focusElement();
			} else if (direction === 'down' && downNeighbor) {
				if (downNeighbor.direction === 'vertical') downNeighbor.focusIndex = 0;

				Container.focusedObject = downNeighbor;
				downNeighbor.focusElement();
			} else if (direction === 'left' && leftNeighbor) {
				if (leftNeighbor.direction === 'horizontal')
					leftNeighbor.focusIndex = leftNeighbor.htmlElements.length - 1;

				Container.focusedObject = leftNeighbor;
				leftNeighbor.focusElement();
			} else if (direction === 'right' && rightNeighbor) {
				if (rightNeighbor.direction === 'horizontal') rightNeighbor.focusIndex = 0;

				Container.focusedObject = rightNeighbor;
				rightNeighbor.focusElement();
			}
		}
	}

	getUpNeighbor() {
		return this.upNeighbor;
	}

	getDownNeighbor() {
		return this.downNeighbor;
	}

	getLeftNeighbor() {
		return this.leftNeighbor;
	}

	getRightNeighbor() {
		return this.rightNeighbor;
	}

	focusElement() {
		this.htmlElements[this.focusIndex].focus();
	}

	setParent(parent: Container) {
		this.parent = parent;
		return this;
	}

	addHtmlElement(htmlElement: HTMLElement) {
		this.htmlElements.push(htmlElement);
		return this;
	}

	removeHtmlElement(htmlElement: HTMLElement) {
		this.htmlElements = this.htmlElements.filter((element) => element !== htmlElement);
		return this;
	}

	setUpNeighbor(upNeighbor: Container) {
		this.upNeighbor = upNeighbor;
		upNeighbor.downNeighbor = this;
		return this;
	}

	setDownNeighbor(downNeighbor: Container) {
		this.downNeighbor = downNeighbor;
		downNeighbor.upNeighbor = this;
		return this;
	}

	setLeftNeighbor(leftNeighbor: Container) {
		this.leftNeighbor = leftNeighbor;
		leftNeighbor.rightNeighbor = this;
		return this;
	}

	setRightNeighbor(rightNeighbor: Container) {
		this.rightNeighbor = rightNeighbor;
		rightNeighbor.leftNeighbor = this;
		return this;
	}

	setDirection(direction: 'horizontal' | 'vertical') {
		this.direction = direction;
		return this;
	}
}

export function handleKeyboardNavigation(event: KeyboardEvent) {
	const currentlyFocusedObject = Container.focusedObject;

	if (!currentlyFocusedObject) {
		console.error('No focused object!!!');
		return;
	}

	if (event.key === 'ArrowUp') {
		currentlyFocusedObject.giveFocus('up');
	} else if (event.key === 'ArrowDown') {
		currentlyFocusedObject.giveFocus('down');
	} else if (event.key === 'ArrowLeft') {
		currentlyFocusedObject.giveFocus('left');
	} else if (event.key === 'ArrowRight') {
		currentlyFocusedObject.giveFocus('right');
	}
}

const navBar = new Container().setDirection('vertical');
const main = new Container().setDirection('vertical');
const home = new Container();

home.setLeftNeighbor(main);

export const navigationContainers = {
	home,
	main,
	navBar
};
