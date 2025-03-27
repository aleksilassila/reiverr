import { getTmdbApi, getTmdbApi4 } from '$lib/apis/tmdb/tmdb-api';
import { tick } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { getReiverrApi, type ReiverrUser } from '../apis/reiverr/reiverr-api';
import { type Session, sessions } from './session.store';

export let reiverrApi: ReturnType<typeof getReiverrApi>;
export let tmdbApi: ReturnType<typeof getTmdbApi>;
export let tmdbApi4: ReturnType<typeof getTmdbApi4>;

function useUser() {
	const activeSession = derived(sessions, (sessions) => sessions.activeSession);
	const userStore = writable<ReiverrUser | undefined | null>(undefined);

	async function updateUser(updateFn: (user: ReiverrUser) => ReiverrUser) {
		const user = get(userStore);

		if (!user) return;

		const updated = updateFn(user);
		const { user: update, error } = await reiverrApi.users
			.updateUser(updated.id, updated)
			.then((r) => ({ user: r.data, error: undefined }))
			.catch((e) => ({ error: e, user: undefined }));

		if (update) {
			userStore.set(update);
		}

		return error;
	}

	let lastActiveSession: Session | undefined;
	const refreshUser = async (activeSession = get(sessions)?.activeSession) => {
		if (!activeSession) {
			userStore.set(null);
			return;
		}

		userStore.set(undefined);
		lastActiveSession = activeSession;
		const user = await getReiverrApi(activeSession)
			.users.findUserById(activeSession.id)
			.then((r) => r.data)
			.catch(() => null);

		if (lastActiveSession === activeSession) {
			reiverrApi = getReiverrApi();
			tmdbApi = getTmdbApi();
			tmdbApi4 = getTmdbApi4(user);
			userStore.set(user);
		}
	};

	activeSession.subscribe(async (activeSession) => {
		await refreshUser(activeSession);
	});

	return {
		subscribe: userStore.subscribe,
		updateUser,
		refreshUser
	};
}

export const user = useUser();

export const isAppInitialized = derived(user, ($user) => {
	return $user !== undefined;
});
export const awaitAppInitialization = () =>
	new Promise((resolve) => {
		const unsubscribe = isAppInitialized.subscribe(async (u) => {
			if (u) {
				resolve(undefined);
				await tick();
				unsubscribe();
			}
		});
	});
