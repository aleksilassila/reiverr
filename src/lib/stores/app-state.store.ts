import { derived, writable } from 'svelte/store';
import { createLocalStorageStore } from './localstorage.store';
import { getReiverrApiClient, type ReiverrUser } from '../apis/reiverr/reiverr-api';

interface AuthenticationStoreData {
	token?: string;
	serverBaseUrl?: string;
}
const authenticationStore = createLocalStorageStore<AuthenticationStoreData>(
	'authentication-token',
	{
		token: undefined,
		serverBaseUrl: window?.location?.origin
	}
);

function createAppState() {
	const userStore = writable<ReiverrUser | null>(undefined);

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

	function setUser(user: ReiverrUser | null) {
		userStore.set(user);
	}

	function logOut() {
		setUser(null);
		setToken(undefined);
	}

	return {
		subscribe: combinedStore.subscribe,
		setBaseUrl,
		setToken,
		setUser,
		logOut
	};
}

export const appState = createAppState();
export const appStateUser = derived(appState, ($state) => $state.user);

authenticationStore.subscribe((auth) => {
	if (auth.token) {
		getReiverrApiClient(auth.serverBaseUrl, auth.token)
			?.GET('/user', {})
			.then((res) => res.data)
			.then((user) => appState.setUser(user || null))
			.catch((err) => appState.setUser(null));
	} else {
		appState.setUser(null);
	}
});
