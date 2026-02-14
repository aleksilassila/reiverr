import { getContext, hasContext } from '$lib/components/StackRouter/stack-router.store';
import { createStoreContext } from '$lib/utils';

const BREADCRUMBS_CONTEXT = 'breadcrumbs';

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
