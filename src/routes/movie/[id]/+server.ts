import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';
import { getRadarrMovieByTmdbId, getRadarrDownloadsById } from '$lib/apis/radarr/radarrApi';

export const _parseMovieId = (params: any) => {
	const { id: tmdbId } = params;

	if (!tmdbId) throw error(400, 'NO_TMDB_ID');

	return tmdbId;
};

export const GET = (async ({ params }) => {
	const tmdbId = _parseMovieId(params);

	const jellyfinMoviePromise = getJellyfinItemByTmdbId(tmdbId);
	const radarrMoviePromise = getRadarrMovieByTmdbId(tmdbId);
	const radarrMovieQueuedPromise = radarrMoviePromise.then((movie) =>
		movie?.id ? getRadarrDownloadsById(movie.id) : undefined
	);

	const [jellyfinItem, radarrMovie, radarrDownloads] = await Promise.all([
		jellyfinMoviePromise,
		radarrMoviePromise,
		radarrMovieQueuedPromise
	]);

	return json({
		canStream: !!jellyfinItem,
		hasLocalFiles: radarrMovie?.hasFile || !!jellyfinItem,
		isAdded: !!radarrMovie,
		isDownloading: !!radarrDownloads?.length,

		jellyfinItem,
		radarrMovie,
		radarrDownloads
	});
}) satisfies RequestHandler;