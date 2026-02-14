import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
import { getContext, hasContext } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';
import { writable } from 'svelte/store';

// /** @deprecated */
// function useTitlePage() {
// 	const componentStack = useComponentStack();

// 	const openEpisodeMenu = (tmdbId: string, season: number, episode: number) => {};
// 	// componentStack.push({
// 	// 	component: ActionsMenu,
// 	// 	props: {
// 	// 		tmdbId,
// 	// 		season,
// 	// 		episode
// 	// 	}
// 	// });

// 	const openManageSeries = (tmdbId: string) => {};
// 	// componentStack.push({
// 	// 	component: ManageMenu,
// 	// 	props: {
// 	// 		tmdbId
// 	// 	}
// 	// });

// 	return {
// 		componentStack,
// 		openEpisodeMenu,
// 		openManageSeries
// 	};
// }

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
