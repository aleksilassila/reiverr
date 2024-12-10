import { derived, get, writable } from 'svelte/store';
import { getReiverrApiNew, reiverrApi, type ReiverrUser } from '../apis/reiverr/reiverr-api';
import axios from 'axios';
import type { operations } from '../apis/reiverr/reiverr.generated';
import { type Session, sessions } from './session.store';
import { user } from './user.store';

function useSources() {
	const availableSources = derived(
		user,
		(user) => user?.mediaSources?.filter((s) => s.enabled)?.map((s) => ({ ...s })) ?? []
	);

	return {
		subscribe: availableSources.subscribe
	};
}

export const sources = useSources();
