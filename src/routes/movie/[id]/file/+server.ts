import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { parseMovieId } from '../+server';
import { addRadarrMovie, deleteRadarrMovie } from '$lib/radarr/radarr';

// Delete download
export const DELETE = (async ({ params }) => {
	const radarrMovieId = parseMovieId(params);

	const success = await deleteRadarrMovie(radarrMovieId);

	return json({ success });
}) satisfies RequestHandler;
