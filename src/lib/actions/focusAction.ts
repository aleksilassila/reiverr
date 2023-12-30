export type Registerer = (htmlElement: HTMLElement) => { destroy: () => void };

export class Container {
	id: symbol;
	name: string;
	parent?: Container;
	children: Container[] = [];
	htmlElement?: HTMLElement;
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

	getRegisterer(): Registerer {
		return (htmlElement: HTMLElement) => {
			this.addChildElement(htmlElement);

			return {
				destroy: () => {
					this.removeChildElement(htmlElement);
				}
			};
		};
	}

	giveFocus(direction: 'up' | 'down' | 'left' | 'right') {
		console.log('This: ');
		this.log();

		console.log('Giving focus to', direction, 'neighbor');
		const upNeighbor = this.getUpNeighbor();
		const downNeighbor = this.getDownNeighbor();
		const leftNeighbor = this.getLeftNeighbor();
		const rightNeighbor = this.getRightNeighbor();
		if (direction === 'up' && upNeighbor) {
			if (upNeighbor.direction === 'vertical') {
				upNeighbor.focusIndex = upNeighbor.children.length - 1;
			}

			upNeighbor.focusElement();
		} else if (direction === 'down' && downNeighbor) {
			if (downNeighbor.direction === 'vertical') {
				downNeighbor.focusIndex = 0;
			}

			downNeighbor.focusElement();
		} else if (direction === 'left' && leftNeighbor) {
			if (leftNeighbor.direction === 'horizontal') {
				leftNeighbor.focusIndex = leftNeighbor.children.length - 1;
			}

			leftNeighbor.focusElement();
		} else if (direction === 'right' && rightNeighbor) {
			if (rightNeighbor.direction === 'horizontal') {
				rightNeighbor.focusIndex = 0;
			}

			rightNeighbor.focusElement();
		} else {
			return false;
		}

		return true;
	}

	private getUpNeighbor(): Container | undefined {
		return this.upNeighbor || this.parent?.getUpNeighbor();
	}

	private getDownNeighbor(): Container | undefined {
		return this.downNeighbor || this.parent?.getDownNeighbor();
	}

	private getLeftNeighbor(): Container | undefined {
		return this.leftNeighbor || this.parent?.getLeftNeighbor();
	}

	private getRightNeighbor(): Container | undefined {
		return this.rightNeighbor || this.parent?.getRightNeighbor();
	}

	focusElement() {
		Container.focusedObject = this;
		if (this.htmlElement) {
			this.htmlElement.focus({ preventScroll: true });
			this.htmlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

			if (this.parent) {
				this.parent.focusIndex = this.parent.children.findIndex((child) => child === this);
			}
		} else {
			this.children[this.focusIndex].focusElement();
		}
	}

	private setParent(parent?: Container) {
		this.parent = parent;
		return this;
	}

	private setHtmlElement(htmlElement: HTMLElement) {
		this.htmlElement = htmlElement;
		return this;
	}

	addChild(child: Container) {
		console.log('Adding child', child.name, 'to', this.name);
		if (this.direction === 'vertical' && this.children.length >= 1) {
			child.setUpNeighbor(this.children[this.children.length - 1]);
		} else if (this.direction === 'horizontal' && this.children.length >= 1) {
			child.setLeftNeighbor(this.children[this.children.length - 1]);
		}
		this.children.push(child.setParent(this));
		console.log('After add', this);
		return this;
	}

	private addChildElement(htmlElement: HTMLElement) {
		const childContainer = new Container().setHtmlElement(htmlElement).setParent(this);

		if (this.direction === 'vertical' && this.children.length >= 1) {
			childContainer.setUpNeighbor(this.children[this.children.length - 1]);
		} else if (this.direction === 'horizontal' && this.children.length >= 1) {
			childContainer.setLeftNeighbor(this.children[this.children.length - 1]);
		}

		this.children.push(childContainer);
		return this;
	}

	private removeChildElement(htmlElement: HTMLElement) {
		const child = this.children.find((child) => child.htmlElement === htmlElement);
		child?.setParent(undefined)?.removeNeighbors();
		this.children = this.children.filter((child) => child.htmlElement !== htmlElement);
		return this;
	}

	private removeNeighbors() {
		if (this.upNeighbor?.downNeighbor === this) {
			this.upNeighbor.downNeighbor = undefined;
		}
		if (this.downNeighbor?.upNeighbor === this) {
			this.downNeighbor.upNeighbor = undefined;
		}
		if (this.leftNeighbor?.rightNeighbor === this) {
			this.leftNeighbor.rightNeighbor = undefined;
		}
		if (this.rightNeighbor?.leftNeighbor === this) {
			this.rightNeighbor.leftNeighbor = undefined;
		}
		this.upNeighbor = undefined;
		this.downNeighbor = undefined;
		this.leftNeighbor = undefined;
		this.rightNeighbor = undefined;
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

	log() {
		console.log(this.name, this);
		if (this.parent) {
			console.log('With parent: ');
			this.parent.log();
		}
	}
}

export function handleKeyboardNavigation(event: KeyboardEvent) {
	const currentlyFocusedObject = Container.focusedObject;

	if (!currentlyFocusedObject) {
		console.error('No focused object!!!');
		return;
	}

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

const navBar = new Container('navBar').setDirection('vertical');
const main = new Container('main').setDirection('vertical');
const home = new Container('home').setDirection('vertical');

main.setLeftNeighbor(navBar);
main.addChild(home);

export const navigationContainers = {
	home,
	main,
	navBar
};
