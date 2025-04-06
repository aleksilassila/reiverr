import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
import {
	createErrorNotification,
	createInfoNotification
} from '$lib/components/Notifications/notification.store';
import { useComponentStack } from '$lib/stores/component-stack.store';
import {
	TITLE_USER_DATA_CONTEXT,
	type TitleUserData
} from '$lib/stores/user-data/title-user-data.store';
import { reiverrApi } from '$lib/stores/user.store';
import { createStoreContext } from '$lib/utils';
import { getContext, hasContext } from 'svelte';
import { writable } from 'svelte/store';

function usePlayableDataStore(options: { tmdbId: string; season?: number; episode?: number }) {
	const { tmdbId, season, episode } = options;

	if (!hasContext(TITLE_USER_DATA_CONTEXT)) throw new Error('TitleUserDataContext not found');
	const titleUserData = getContext<TitleUserData>(TITLE_USER_DATA_CONTEXT);

	async function handleAction(source: MediaSourceDto, targetId: string, action: string) {
		const { toast, result, error } = await reiverrApi.sources
			.handleViewAction(source.id, targetId, action)
			.then((r) => r.data);

		if (toast && toast.type === 'info') {
			createInfoNotification(toast.title, toast.message);
		} else if (toast && toast.type === 'error') {
			createErrorNotification(toast.title, toast.message);
		}

		// if (error) {

		// }
	}

	async function handleOpenView(source: MediaSourceDto, viewId: string, callerId: string) {}

	return {
		...options,
		...titleUserData,
		handleAction,
		handleOpenView
	};
}

export const playableDataContext = createStoreContext(
	'actions-page-context',
	usePlayableDataStore,
	{ required: true }
);

export const mediaSourceContext = createStoreContext('media-source', () =>
	writable<MediaSourceDto | undefined>(undefined)
);

export const titlePageContext = createStoreContext(
	'title-page',
	() => ({
		componentStack: useComponentStack()
	}),
	{
		required: true
	}
);
