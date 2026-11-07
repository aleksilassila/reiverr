import type { Component, ComponentProps } from 'svelte';
import { writable } from 'svelte/store';
import Notification from './Notification.svelte';

type NotificationItem<T extends Component<any> = Component<any>> = {
	id: symbol;
	component: T;
	props: ComponentProps<T>;
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
	const body = message ?? title;
	console.error(body);
	notificationStack.create(Notification, {
		title: message ? title : 'Unexpected error occurred',
		body,
		type: 'error'
	});
};
export const createInfoNotification = (title: string, message?: string) => {
	notificationStack.create(Notification, { title, body: message });
};
