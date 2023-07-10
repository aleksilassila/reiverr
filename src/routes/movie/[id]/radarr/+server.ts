import { parseMovieId } from '../+server';
import { addRadarrMovie, getRadarrMovieByTmdbId } from '$lib/apis/radarr/radarrApi';
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

	const response = await getRadarrMovieByTmdbId(tmdbId);

	return json(response);
}) satisfies RequestHandler;
