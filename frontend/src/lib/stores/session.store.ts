import { getPublicReiverrApi } from '$lib/apis/reiverr/reiverr-api';
import { AxiosError } from 'axios';
import { createLocalStorageStore } from './localstorage.store';

export interface Session {
	id: string;
	baseUrl: string;
	token: string;
}

function useSessions() {
	const sessions = createLocalStorageStore<{ sessions: Session[]; activeSession?: Session }>(
		'sessions',
		{
			sessions: []
		}
	);

	function setActiveSession(session?: Session) {
		sessions.update((s) => ({ ...s, activeSession: session }));
	}

	async function addSession(baseUrl: string, name: string, password: string, activate = true) {
		const res = await getPublicReiverrApi(baseUrl)
			.api.signIn({ name, password })
			.catch((e: AxiosError) => {
				if (e.response?.status && e.response?.status >= 500) throw new Error('Server error');
				else if (e.response?.status && e.response?.status >= 400)
					throw new Error('Invalid credentials');
				else throw new Error('Could not connect to the server');
			});

		const session = {
			id: res.data.user.id,
			baseUrl,
			token: res.data.accessToken
		};

		sessions.update((s) => {
			const sessions = s.sessions.filter((s) => s.id !== session.id).concat(session);
			return {
				sessions,
				activeSession: activate ? session : s.activeSession
			};
		});

		return res;
	}

	function removeSession(_session?: Session) {
		sessions.update((s) => {
			const session = _session || s.activeSession;
			const sessions = s.sessions.filter((s) => s.id !== session?.id);
			return {
				sessions,
				activeSession: s.activeSession?.id === session?.id ? undefined : s.activeSession
			};
		});
	}

	function removeSessions() {
		sessions.set({ sessions: [] });
	}

	return {
		subscribe: sessions.subscribe,
		setActiveSession,
		addSession,
		removeSession,
		removeSessions
	};
}

export const sessions = useSessions();
