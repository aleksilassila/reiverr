import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { _parseMovieId } from '../+server';
import { addRadarrMovie, deleteRadarrMovie } from '$lib/apis/radarr/radarrApi';

// Delete download
export const DELETE = (async ({ params }) => {
	const radarrMovieId = _parseMovieId(params);

	const success = await deleteRadarrMovie(radarrMovieId);

	return json({ success });
}) satisfies RequestHandler;
