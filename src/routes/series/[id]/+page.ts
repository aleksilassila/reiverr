import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		tmdbId: Number(params.id)
	};
}) satisfies PageLoad;
