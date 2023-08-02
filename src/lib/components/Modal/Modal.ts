import { writable } from 'svelte/store';

function createModalStack() {
	const store = writable<{ stack: Symbol[]; top: Symbol | undefined }>({
		stack: [],
		top: undefined
	});

	return {
		...store,
		push: (symbol: Symbol) => {
			store.update((s) => {
				if (s.stack.includes(symbol)) {
					return s;
				}

				s.stack.push(symbol);
				s.top = symbol;
				return s;
			});
		},
		remove: (symbol: Symbol) => {
			store.update((s) => {
				s.stack = s.stack.filter((x) => x !== symbol);
				s.top = s.stack[s.stack.length - 1];
				return s;
			});
		}
	};
}

export const modalStack = createModalStack();

export type ModalProps = ReturnType<typeof createModalProps>;

export function createModalProps(onClose: () => void, onBack?: () => void) {
	const id = Symbol();

	function close() {
		onClose(); // ORDER MATTERS HERE
		modalStack.remove(id);
	}

	function back() {
		onBack?.();
		modalStack.remove(id);
	}

	return {
		close,
		back,
		id
	};
}
