import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrollElementIntoView, smoothScrollTo } from './scroll-into-view';

/** A list 500 high whose content is 2000 high, with a row 100 high at 1000 of the content */
function mountList() {
	const list = document.createElement('div');
	const row = document.createElement('div');
	list.style.overflowY = 'auto';
	list.append(row);
	document.body.append(list);

	// jsdom lays nothing out
	Object.defineProperties(list, { scrollHeight: { value: 2000 }, clientHeight: { value: 500 } });
	list.getBoundingClientRect = () => new DOMRect(0, 0, 500, 500);
	row.getBoundingClientRect = () => new DOMRect(0, 1000 - list.scrollTop, 500, 100);

	return { list, row };
}

let now = 0;

/** Lets the time pass in frames of the given length; a slow TV has long ones */
function pass(milliseconds: number, frameLength = 16) {
	for (let passed = 0; passed < milliseconds; passed += frameLength) {
		now += frameLength;
		// One frame of the fake requestAnimationFrame, whatever time the frame is said to have taken
		vi.advanceTimersByTime(16);
	}
}

/** Longer than any smooth scroll takes */
const finishScrolling = () => pass(1000);

beforeEach(() => {
	now = 0;
	vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
	vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	document.body.replaceChildren();
});

describe('a smooth scroll', () => {
	it('takes the element to the position over the frames that follow', () => {
		const { list } = mountList();
		const done = vi.fn();

		smoothScrollTo({ element: list, top: 600, cb: done });
		expect(list.scrollTop).toBe(0);

		pass(100);
		expect(list.scrollTop).toBeGreaterThan(0);
		expect(list.scrollTop).toBeLessThan(600);
		expect(done).not.toHaveBeenCalled();

		finishScrolling();
		expect(list.scrollTop).toBe(600);
		expect(done).toHaveBeenCalledTimes(1);
	});

	it('ends at the position, never past it, when its frames come late', () => {
		const { list } = mountList();
		const positions: number[] = [];

		smoothScrollTo({ element: list, top: 600 });
		for (let frame = 0; frame < 5; frame++) {
			pass(200, 200);
			positions.push(list.scrollTop);
		}

		expect(Math.max(...positions)).toBe(600);
		expect(list.scrollTop).toBe(600);
	});

	it('leaves an element that is at the position already to whatever scrolls it next', () => {
		const { list } = mountList();
		const done = vi.fn();

		smoothScrollTo({ element: list, top: 0, cb: done });
		pass(16);
		expect(done).toHaveBeenCalledTimes(1);

		list.scrollTop = 300;
		finishScrolling();
		expect(list.scrollTop).toBe(300);
	});

	it('gives way to the smooth scroll asked for after it', () => {
		const { list } = mountList();

		smoothScrollTo({ element: list, top: 600 });
		pass(100);
		smoothScrollTo({ element: list, top: 200 });
		finishScrolling();

		expect(list.scrollTop).toBe(200);
	});

	it('stops with the function it returns, before its first frame as after it', () => {
		const { list } = mountList();

		smoothScrollTo({ element: list, top: 600 })();
		finishScrolling();
		expect(list.scrollTop).toBe(0);

		const cancel = smoothScrollTo({ element: list, top: 600 });
		pass(100);
		cancel();
		const stoppedAt = list.scrollTop;
		finishScrolling();
		expect(list.scrollTop).toBe(stoppedAt);
	});
});

// The requests view opened at a season further down: the first row had the focus and with it a
// smooth scroll to the top, and the list went back there after it was scrolled to the season
describe('an instant scroll into view', () => {
	it('ends a smooth scroll that waits for its first frame', () => {
		const { list, row } = mountList();
		list.scrollTop = 300;

		smoothScrollTo({ element: list, top: 0 });
		scrollElementIntoView(row, { top: 96, instant: true });
		expect(list.scrollTop).toBe(904);

		finishScrolling();
		expect(list.scrollTop).toBe(904);
	});

	it('ends a smooth scroll that is running', () => {
		const { list, row } = mountList();
		list.scrollTop = 300;

		smoothScrollTo({ element: list, top: 0 });
		pass(100);
		scrollElementIntoView(row, { top: 96, instant: true });

		finishScrolling();
		expect(list.scrollTop).toBe(904);
	});

	it('gives way to the smooth scroll asked for after it', () => {
		const { list, row } = mountList();

		scrollElementIntoView(row, { top: 96, instant: true });
		scrollElementIntoView(row, { top: 32 });
		finishScrolling();

		expect(list.scrollTop).toBe(968);
	});
});
