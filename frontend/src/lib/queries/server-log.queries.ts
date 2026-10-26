import type { LogEntryDto } from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { pagedQueryOptions } from './query-client';

const ENTRIES_PAGE_SIZE = 50;

export const serverLogKeys = {
	all: ['server-log'] as const,
	entries: (type: LogEntryDto['type'] | undefined) => ['server-log', { type }] as const
};

export const serverLogQueries = {
	/** What the server did on its own, newest first */
	entries: (type: LogEntryDto['type'] | undefined) =>
		pagedQueryOptions({
			queryKey: serverLogKeys.entries(type),
			queryFn: (page) =>
				reiverrApi.serverLog
					.getServerLogEntries({ page, itemsPerPage: ENTRIES_PAGE_SIZE, type })
					.then((r) => r.data.items)
		})
};
