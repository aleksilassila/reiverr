import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getJellyfinItemByTmdbId } from '$lib/jellyfin/jellyfin';
import { getRadarrMovie, getRadarrQueuedById } from '$lib/radarr/radarr';

export const parseTmdbId = (params: any) => {
	const { id: tmdbId } = params;

	if (!tmdbId) throw error(400, 'NO_TMDB_ID');

	return tmdbId;
};

export const GET = (async ({ params }) => {
	const tmdbId = parseTmdbId(params);

	const jellyfinMoviePromise = getJellyfinItemByTmdbId(tmdbId);
	const radarrMoviePromise = getRadarrMovie(tmdbId);
	const radarrMovieQueuedPromise = radarrMoviePromise.then((movie) =>
		movie ? getRadarrQueuedById(String(movie.id)) : undefined
	);

	const [jellyfinItem, radarrMovie, radarrDownload] = await Promise.all([
		jellyfinMoviePromise,
		radarrMoviePromise,
		radarrMovieQueuedPromise
	]);

	return json({
		canStream: !!jellyfinItem,
		hasLocalFiles: radarrMovie?.hasFile || !!jellyfinItem,
		isAdded: !!radarrMovie,
		isDownloading: !!radarrDownload,

		jellyfinItem,
		radarrMovie,
		radarrDownload
	});
}) satisfies RequestHandler;
