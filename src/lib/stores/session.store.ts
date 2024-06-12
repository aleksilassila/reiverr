import { createLocalStorageStore } from './localstorage.store';
import type { operations } from '../apis/reiverr/reiverr.generated';
import axios from 'axios';

export interface Session {
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

	function setActiveSession(session: Session) {
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
			baseUrl,
			token: res.data.accessToken
		};

		sessions.update((s) => {
			const sessions = s.sessions.concat(session);
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
			const sessions = s.sessions.filter((s) => s !== session);
			return {
				sessions,
				activeSession: s.activeSession === session ? undefined : s.activeSession
			};
		});
	}

	return {
		subscribe: sessions.subscribe,
		setActiveSession,
		addSession,
		removeSession
	};
}

export const sessions = useSessions();
