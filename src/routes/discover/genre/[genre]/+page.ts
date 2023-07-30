import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		genre: params.genre
	};
}) satisfies PageLoad;
