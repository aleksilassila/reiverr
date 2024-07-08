import type { ComponentProps, ComponentType } from 'svelte';
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

	function createDefault(props: ComponentProps<Notification>) {
		return create(Notification, props);
	}

	return {
		subscribe: notifications.subscribe,
		create,
		createDefault
	};
}

export const notificationStack = useNotificationStack();
