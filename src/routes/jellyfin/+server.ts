import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';

export const GET = (async ({ params, request }) => {
	const body = await request.json();

	const { tmdbId } = body;

	if (!tmdbId) throw error(400, 'NO_TMDB_ID');

	const response = await getJellyfinItemByTmdbId(tmdbId);

	return json(response);
}) satisfies RequestHandler;
