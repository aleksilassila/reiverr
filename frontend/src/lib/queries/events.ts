import type { Session } from '$lib/stores/session.store';
import type { QueryKey } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { movieKeys } from './movie.queries';
import { invalidate, queryClient } from './query-client';
import { seriesKeys } from './series.queries';
import { serverKeys } from './server.queries';
import { storageKeys } from './storage.queries';

/** A burst of events from one change becomes one refetch */
const DEBOUNCE = 250;

type Title = { mediaType: 'movie' | 'series'; tmdbId: string };

const keysOf = (title: Title) => (title.mediaType === 'movie' ? movieKeys : seriesKeys);
const titleOf = (event: MessageEvent): Title => JSON.parse(event.data);

let source: EventSource | undefined;
let connected: Pick<Session, 'baseUrl' | 'token'> | undefined;
let pending = new Map<string, QueryKey>();
let timer: ReturnType<typeof setTimeout> | undefined;

function queue(...keys: QueryKey[]) {
	for (const key of keys) pending.set(JSON.stringify(key), key);
	clearTimeout(timer);
	timer = setTimeout(() => {
		const keys = [...pending.values()];
		pending = new Map();
		invalidate(...keys);
	}, DEBOUNCE);
}

/**
 * Listens to the events of the server for the session: what changed on the server without the
 * client is fetched again. A connection that was lost is made again by the browser, and everything
 * is fetched again then, since events were missed meanwhile.
 */
export function connectEvents(session: Session | undefined) {
	if (session?.baseUrl === connected?.baseUrl && session?.token === connected?.token) return;
	source?.close();
	source = undefined;
	connected = session && { baseUrl: session.baseUrl, token: session.token };
	if (!session) return;

	// EventSource sends no headers, so the token goes in the URL, as it does for the streams
	const url = `${session.baseUrl.replace(/\/$/, '')}/api/me/events?reiverr_token=${encodeURIComponent(session.token)}`;
	const events = new EventSource(url);
	let wasOpen = false;
	events.onopen = () => {
		if (wasOpen) queryClient.invalidateQueries();
		wasOpen = true;
	};
	events.addEventListener('requests', (event) => {
		const title = titleOf(event);
		const keys = keysOf(title);
		queue(keys.requests(title.tmdbId), keys.status(title.tmdbId), storageKeys.all, catalogKeys.all);
	});
	events.addEventListener('library', (event) => {
		const title = titleOf(event);
		const keys = keysOf(title);
		queue(
			keys.status(title.tmdbId),
			keys.files(title.tmdbId),
			storageKeys.all,
			catalogKeys.all,
			serverKeys.library()
		);
	});
	events.addEventListener('downloads', (event) => {
		const title = titleOf(event);
		queue(keysOf(title).torrents(title.tmdbId), catalogKeys.downloads());
	});
	events.addEventListener('storage', () => queue(storageKeys.all));
	source = events;
}
