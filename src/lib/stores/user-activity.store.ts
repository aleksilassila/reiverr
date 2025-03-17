import { writable } from 'svelte/store';

const isUserInactiveStore = writable(false);
let activityTimeout: ReturnType<typeof setTimeout>;

export function registerUserActivity() {
	isUserInactiveStore.set(false);
	clearTimeout(activityTimeout);

	activityTimeout = setTimeout(() => {
		isUserInactiveStore.set(true);
	}, 2500);
}

export const isUserInactive = {
	subscribe: isUserInactiveStore.subscribe
};
