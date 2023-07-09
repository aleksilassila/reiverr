import { parseMovieId } from '../+server';
import { addRadarrMovie, getRadarrMovie } from '$lib/apis/radarr/radarrApi';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Add to radarr
export const POST = (async ({ params }) => {
	const tmdbId = parseMovieId(params);

	const response = await addRadarrMovie(tmdbId);

	return json(response);
}) satisfies RequestHandler;

export const GET = (async ({ params }) => {
	const tmdbId = parseMovieId(params);

	const response = await getRadarrMovie(tmdbId);

	return json(response);
}) satisfies RequestHandler;
