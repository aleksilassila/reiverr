import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { parseTmdbId } from '../+server';
import { addRadarrMovie } from '$lib/radarr/radarr';

export const POST = (async ({ params }) => {
	const tmdbId = parseTmdbId(params);

	const response = await addRadarrMovie(tmdbId);

	return json(response);
}) satisfies RequestHandler;
