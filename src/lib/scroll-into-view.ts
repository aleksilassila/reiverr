import { get_store_value as get } from 'svelte/internal';
import { localSettings } from './stores/localstorage.store';

export type Offsets = Partial<
	Record<
		'top' | 'bottom' | 'left' | 'right' | 'horizontal' | 'vertical' | 'all',
		number | undefined
	>
>;

export function getScrollParent(
	node: HTMLElement,
	direction: 'vertical' | 'horizontal',
	overflowedOnly = true,
	includeSelf = false
): HTMLElement | undefined {
	const parent = includeSelf ? node : node.parentElement;

	if (parent) {
		const style = window.getComputedStyle(parent);
		const overflow = direction === 'vertical' ? style.overflowY : style.overflowX;

		if (
			((direction === 'vertical' && parent.scrollHeight > parent.clientHeight) ||
				(direction === 'horizontal' && parent.scrollWidth > parent.clientWidth) ||
				!overflowedOnly) &&
			(overflow === 'auto' || overflow === 'scroll')
		) {
			return parent;
		} else {
			return getScrollParent(parent, direction, overflowedOnly);
		}
	}

	return node;
}

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
			smoothScrollTo({ element: verticalParent, top });
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
			smoothScrollTo({ element: horizontalParent, left });
		}
	}
};

const easeOutCubic = (t: number, d: number) => --t * t * t + 1;
const animationHandles: Map<HTMLElement, number> = new Map();
function smoothScrollTo(options: {
	element: HTMLElement;
	top?: number;
	left?: number;
	duration?: number;
}) {
	if (options.top === undefined && options.left === undefined) return;

	const { element, top = 0, left = 0 } = options;

	if (animationHandles.has(element)) {
		cancelAnimationFrame(animationHandles.get(element)!);
		animationHandles.delete(element);
	}

	const startY = element.scrollTop;
	const startX = element.scrollLeft;
	const yDifference =
		Math.max(0, Math.min(element.scrollHeight - element.clientHeight, top)) - startY;
	const xDifference =
		Math.max(0, Math.min(element.scrollWidth - element.clientWidth, left)) - startX;
	const startTime = performance.now();

	const d = Math.max(Math.abs(yDifference), Math.abs(xDifference));
	const duration = options.duration || Math.min(500, Math.max(250, d / 2));
	console.log(duration, startY, top, yDifference, element.scrollHeight);

	const animate = () => {
		const progress = (performance.now() - startTime) / duration;
		const amount = easeOutCubic(progress, d);
		element.scrollTo({ top: startY + amount * yDifference, left: startX + amount * xDifference });
		if (progress < 0.99) {
			animationHandles.set(element, requestAnimationFrame(animate));
		}
	};

	animationHandles.set(element, requestAnimationFrame(animate));
}
