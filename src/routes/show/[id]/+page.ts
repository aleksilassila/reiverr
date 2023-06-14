import type { PageLoad } from './$types';

export const load = (({ params }) => ({ tmdbId: params.id })) satisfies PageLoad;
