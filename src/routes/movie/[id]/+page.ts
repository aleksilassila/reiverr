import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		tmdbId: params.id
	};
}) satisfies PageLoad;
