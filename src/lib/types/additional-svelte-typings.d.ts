import type { EnterEvent } from '../selectable';

declare namespace svelteHTML {
	// enhance elements
	interface IntrinsicElements {
		Container: { 'on:enter': (e: EnterEvent) => void };
	}
	// // enhance attributes
	// interface HTMLAttributes<T> {
	// 	// If you want to use on:beforeinstallprompt
	// 	'on:beforeinstallprompt'?: (event: any) => any;
	// 	// If you want to use myCustomAttribute={..} (note: all lowercase)
	// 	mycustomattribute?: any; // You can replace any with something more specific if you like
	// }
}
