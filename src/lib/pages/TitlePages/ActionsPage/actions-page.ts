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
import ActionsMenu from './ActionsMenu.svelte';

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
		handleOpenView,
		playStream: ({ source, streamId }: { source: MediaSourceDto; streamId: string }) =>
			titleUserData.playStream({ source, streamId, season, episode })
	};
}

function useTitlePage() {
	const componentStack = useComponentStack();

	const openEpisodeMenu = (tmdbId: string, season: number, episode: number) =>
		componentStack.create(ActionsMenu, {
			tmdbId,
			season,
			episode
		});

	return {
		componentStack,
		openEpisodeMenu
	};
}

export const playableDataContext = createStoreContext(
	'actions-page-context',
	usePlayableDataStore,
	{ required: true }
);

const BREADCRUMBS_CONTEXT = 'actions-page-breadcrumbs';
export const breadcrumbsContext = createStoreContext(BREADCRUMBS_CONTEXT, (bc: string) => {
	if (!hasContext(BREADCRUMBS_CONTEXT)) {
		return {
			breadcrumbs: [bc]
		};
	}

	const { breadcrumbs } = getContext<{
		breadcrumbs: string[];
	}>(BREADCRUMBS_CONTEXT);

	return {
		breadcrumbs: [...breadcrumbs, bc]
	};
});

export const mediaSourceContext = createStoreContext('media-source', () =>
	writable<MediaSourceDto | undefined>(undefined)
);

export const titlePageContext = createStoreContext('title-page', useTitlePage, {
	required: true
});
