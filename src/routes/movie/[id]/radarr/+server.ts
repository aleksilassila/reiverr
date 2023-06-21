import { parseMovieId } from '../+server';
import { addRadarrMovie } from '$lib/radarr/radarr';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ params }) => {
	const tmdbId = parseMovieId(params);

	const response = await addRadarrMovie(tmdbId);

	return json(response);
}) satisfies RequestHandler;
