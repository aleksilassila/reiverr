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

function useUserActivity() {
	const isUserInactiveStore = writable(false);
	let activityTimeout: ReturnType<typeof setTimeout>;

	function registerUserActivity() {
		isUserInactiveStore.set(false);
		clearTimeout(activityTimeout);

		activityTimeout = setTimeout(() => {
			isUserInactiveStore.set(true);
		}, 2500);
	}

	return {
		subscribe: isUserInactiveStore.subscribe,
		registerUserActivity
	};
}

export const userActivity = useUserActivity();
