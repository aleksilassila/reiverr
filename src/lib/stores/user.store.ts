import axios from 'axios';
import { tick } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { getReiverrApiNew, type ReiverrUser } from '../apis/reiverr/reiverr-api';
import type { operations } from '../apis/reiverr/reiverr.generated';
import type { MediaSource, SourceProviderCapabilitiesDto } from '../apis/reiverr/reiverr.openapi';
import { type Session, sessions } from './session.store';

export let reiverrApiNew: ReturnType<typeof getReiverrApiNew>;

function useUser() {
	const activeSession = derived(sessions, (sessions) => sessions.activeSession);

	const initializedStores = writable({ user: false, sources: false });
	const userStore = writable<ReiverrUser | undefined | null>(undefined);
	const sources = writable<{ source: MediaSource; capabilities: SourceProviderCapabilitiesDto }[]>(
		[]
	);
	const isAppInitialized = derived(initializedStores, ({ user, sources }) => user && sources);

	let lastActiveSession: Session | undefined;
	activeSession.subscribe(async (activeSession) => {
		initializedStores.set({ user: false, sources: false });
		await refreshUser(activeSession);
	});

	userStore.subscribe(async (user) => {
		if (!user) {
			sources.set([]);
			initializedStores.update((i) => ({ ...i, sources: i.user }));
			return;
		}

		const out: { source: MediaSource; capabilities: SourceProviderCapabilitiesDto }[] = [];

		await Promise.all(
			user?.mediaSources
				?.filter((s) => s.enabled)
				?.map(async (s) => {
					out.push({
						source: s,
						capabilities: await reiverrApiNew.providers
							.getSourceCapabilities(s.pluginId, s.pluginSettings ?? ({} as any))
							.then((r) => r.data)
							.catch(() => ({
								episodeIndexing: false,
								episodePlayback: false,
								movieIndexing: false,
								moviePlayback: false
							}))
					});
				}) ?? []
		);

		out.sort((a, b) => a.source.priority - b.source.priority);

		sources.set(out);
		initializedStores.update((i) => ({ ...i, sources: i.user }));
	});

	async function updateUser(updateFn: (user: ReiverrUser) => ReiverrUser) {
		const user = get(userStore);

		if (!user) return;

		const updated = updateFn(user);
		const { user: update, error } = await reiverrApiNew.users
			.updateUser(updated.id, updated)
			.then((r) => ({ user: r.data, error: undefined }))
			.catch((e) => ({ error: e, user: undefined }));

		if (update) {
			initializedStores.update((i) => ({ ...i, user: true }));
			userStore.set(update);
		}

		return error;
	}

	async function refreshUser(activeSession = get(sessions)?.activeSession) {
		if (!activeSession) {
			initializedStores.update((i) => ({ ...i, user: true }));
			userStore.set(null);
			return;
		}

		userStore.set(undefined);
		lastActiveSession = activeSession;
		const user = await axios
			.get<
				operations['UsersController_findById']['responses']['200']['content']['application/json']
			>(activeSession.baseUrl + '/api/users/' + activeSession.id, {
				headers: {
					Authorization: 'Bearer ' + activeSession.token
				}
			})
			.then((r) => r.data)
			.catch(() => null);

		if (lastActiveSession === activeSession) {
			initializedStores.update((i) => ({ ...i, user: true }));
			reiverrApiNew = getReiverrApiNew();
			userStore.set(user);
		}
	}

	// initializedStores.subscribe((i) => console.log('initializedStores', i));

	return {
		user: {
			subscribe: userStore.subscribe,
			updateUser,
			refreshUser
		},
		sources: {
			subscribe: sources.subscribe
		},
		isAppInitialized: {
			subscribe: isAppInitialized.subscribe
		}
	};
}

export const { user, sources, isAppInitialized } = useUser();
export const awaitAppInitialization = () =>
	new Promise((resolve) => {
		const unsubscribe = isAppInitialized.subscribe(async (i) => {
			if (i) {
				resolve(undefined);
				await tick();
				unsubscribe();
			}
		});
	});
