import { derived, get, writable } from 'svelte/store';
import { createLocalStorageStore } from './localstorage.store';
import {
	getReiverrApiClient,
	reiverrApi,
	type ReiverrSettings,
	type ReiverrUser
} from '../apis/reiverr/reiverr-api';

interface AuthenticationStoreData {
	token?: string;
	serverBaseUrl?: string;
}

interface UserStoreData {
	user: ReiverrUser | null;
}

export interface AppStateData extends AuthenticationStoreData {
	user: ReiverrUser | null;
}

const authenticationStore = createLocalStorageStore<AuthenticationStoreData>(
	'authentication-token',
	{
		token: undefined,
		serverBaseUrl: window?.location?.origin
	}
);

function createAppState() {
	const userStore = writable<UserStoreData>(undefined);

	const combinedStore = derived<[typeof userStore, typeof authenticationStore], AppStateData>(
		[userStore, authenticationStore],
		([user, auth]) => {
			return {
				...user,
				...auth
			};
		}
	);

	function setBaseUrl(serverBaseUrl: string | undefined = undefined) {
		authenticationStore.update((p) => ({ ...p, serverBaseUrl }));
	}

	function setToken(token: string | undefined = undefined) {
		authenticationStore.update((p) => ({ ...p, token }));
	}

	function setUser(user: ReiverrUser | null) {
		userStore.set({ user });
	}

	function logOut() {
		setUser(null);
		setToken(undefined);
	}

	const ready = new Promise<AppStateData>((resolve) => {
		combinedStore.subscribe((state) => {
			if (state.token && state.serverBaseUrl && state.user !== undefined) {
				resolve(state);
			}
		});
	});

	async function updateUser(updateFn: (user: ReiverrUser) => ReiverrUser) {
		const user = get(userStore).user;

		if (!user) return;

		const updated = updateFn(user);
		const update = await reiverrApi.updateUser(updated);

		if (update) {
			setUser(update);
		}
	}

	return {
		subscribe: combinedStore.subscribe,
		setBaseUrl,
		setToken,
		setUser,
		updateUser,
		logOut,
		ready
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
