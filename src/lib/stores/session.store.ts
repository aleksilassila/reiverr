import { createLocalStorageStore } from './localstorage.store';
import type { operations } from '../apis/reiverr/reiverr.generated';
import axios from 'axios';
import { get } from 'svelte/store';

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
		const res = await axios
			.post<operations['AuthController_signIn']['responses']['200']['content']['application/json']>(
				baseUrl + '/api/auth',
				{
					name,
					password
				}
			)
			.catch((e) => e.response);

		if (res.status !== 200) return res;

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
