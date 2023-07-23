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
