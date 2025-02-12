import type { ComponentType } from 'svelte';
import { writable } from 'svelte/store';
import Notification from './Notification.svelte';

type NotificationItem = {
	id: symbol;
	component: ComponentType;
	props: Record<string, any>;
};

function useNotificationStack() {
	const notifications = writable<NotificationItem[]>([]);

	function create(component: NotificationItem['component'], props: NotificationItem['props'] = {}) {
		const id = Symbol();
		const item = { id, component, props };
		notifications.update((prev) => [...prev, item]);
		return id;
	}

	function destroy() {
		notifications.set([]);
	}

	return {
		subscribe: notifications.subscribe,
		create,
		destroy
	};
}

export const notificationStack = useNotificationStack();
export const createErrorNotification = (title: string, message?: string) => {
	console.error(message);
	notificationStack.create(Notification, {
		title: message ? title : 'Unexpected error occurred',
		body: message ?? title,
		type: 'error'
	});
};
export const createInfoNotification = (title: string, message?: string) => {
	notificationStack.create(Notification, { title, body: message });
};
