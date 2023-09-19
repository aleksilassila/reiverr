import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		personId: Number(params.id)
	};
}) satisfies PageLoad;
