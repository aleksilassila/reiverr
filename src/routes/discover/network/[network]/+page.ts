import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		network: params.network
	};
}) satisfies PageLoad;
