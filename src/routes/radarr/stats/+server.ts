import { RadarrApi, getRadarrMovies } from '$lib/apis/radarr/radarrApi';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export type RadarrStatsDto = {
	movies: Awaited<ReturnType<typeof getRadarrMovies>>;
};

export const GET = (async () => {
	const radarrMovies = await getRadarrMovies();

	return json({ movies: radarrMovies });
}) satisfies RequestHandler;
