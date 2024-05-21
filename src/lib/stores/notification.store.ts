import { writable } from 'svelte/store';
import Notification from '$lib/components/Notification/Notification.svelte';

export type NotificationItem = {
	id: symbol;
	component: ConstructorOfATypedSvelteComponent;
	props: Record<string, any>;
	timeout: NodeJS.Timeout | undefined;
	duration: number;
	height: number;
};

function createNotificationStack() {
	const stack = writable<NotificationItem[]>([]);

	function create(
		component: ConstructorOfATypedSvelteComponent,
		props: Record<string, any>,
		duration = 5000
	) {
		const id = Symbol();
		const item: NotificationItem = {
			id,
			component,
			props,
			timeout: undefined,
			duration,
			height: 0
		};

		if (duration > 0) {
			item.timeout = setTimeout(() => {
				close(id);
			}, duration);
		}

		stack.update((s) => {
			s.push(item);
			return s;
		});

		return id;
	}

	function close(id: symbol) {
		stack.update((s) => {
			clearTimeout(s.find((i) => i.id === id)?.timeout);
			s = s.filter((i) => i.id !== id);
			return s;
		});
	}

	return {
		...stack,
		create,
		close
	};
}

export const notificationStack = createNotificationStack();

export function createErrorNotification(title: string, details: string, type = 'error') {
	return notificationStack.create(Notification, {
		type,
		title,
		description: details
	});
}
