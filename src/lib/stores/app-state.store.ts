import { derived, writable } from 'svelte/store';
import type { components } from '../apis/reiverr/reiverr.generated';
import { createLocalStorageStore } from './localstorage.store';

export type User = components['schemas']['UserDto'];

interface AuthenticationStoreData {
	token?: string;
	serverBaseUrl?: string;
}

function createAppState() {
	const userStore = writable<User | null>(undefined);
	const authenticationStore = createLocalStorageStore<AuthenticationStoreData>(
		'authentication-token',
		{
			token: undefined,
			serverBaseUrl: window?.location?.origin
		}
	);
	const combinedStore = derived([userStore, authenticationStore], ([$user, $auth]) => {
		return {
			user: $user,
			token: $auth.token,
			serverBaseUrl: $auth.serverBaseUrl
		};
	});

	function setBaseUrl(serverBaseUrl: string | undefined = undefined) {
		authenticationStore.update((p) => ({ ...p, serverBaseUrl }));
	}

	function setToken(token: string | undefined = undefined) {
		authenticationStore.update((p) => ({ ...p, token }));
	}

	function setUser(user: User | null) {
		userStore.set(user);
	}

	return {
		subscribe: combinedStore.subscribe,
		setBaseUrl,
		setToken,
		setUser
	};
}

export const appState = createAppState();
export const appStateUser = derived(appState, ($state) => $state.user);
