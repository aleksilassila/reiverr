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
	direction: 'vertical' | 'horizontal'
): HTMLElement | undefined {
	const parent = node.parentElement;

	if (parent) {
		const { overflow } = window.getComputedStyle(parent);

		if (
			(direction === 'vertical' && parent.scrollHeight > parent.clientHeight) ||
			(direction === 'horizontal' && parent.scrollWidth > parent.clientWidth)
		) {
			return parent;
		} else if (overflow.split(' ').every((o) => o === 'auto' || o === 'scroll')) {
			return parent;
		} else {
			return getScrollParent(parent, direction);
		}
	}
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
