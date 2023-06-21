import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { parseMovieId } from '../+server';
import { addRadarrMovie, deleteRadarrMovie } from '$lib/radarr/radarr';

export const POST = (async ({ params }) => {
	const tmdbId = parseMovieId(params);

	const response = await addRadarrMovie(tmdbId);

	return json(response);
}) satisfies RequestHandler;

export const DELETE = (async ({ params }) => {
	const radarrMovieId = parseMovieId(params);

	const success = await deleteRadarrMovie(radarrMovieId);

	return json({ success });
}) satisfies RequestHandler;
