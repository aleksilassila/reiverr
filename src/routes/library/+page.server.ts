import type { PageServerLoad } from './$types';
import { RadarrApi } from '$lib/radarr/radarr';

export const load = (() => {
	const radarrMovies = RadarrApi.get('/api/v3/movie', {
		params: {}
	}).then((r) => r.data);

	const downloadingRadarrMovies = RadarrApi.get('/api/v3/queue', {
		params: {
			query: {
				includeMovie: true
			}
		}
	}).then((r) => r.data?.records?.filter((record) => record.movie));

	const downloading = downloadingRadarrMovies.then(async (movies) => {
		return movies?.map((m) => ({
			tmdbId: m.movie?.tmdbId,
			size: m.size,
			sizeleft: m.sizeleft
		}));
	});

	const unavailable = radarrMovies.then(async (movies) => {
		const downloadingMovies = await downloading;
		return movies?.filter(
			(m) =>
				(!m.movieFile || !m.hasFile || !m.isAvailable) &&
				!downloadingMovies?.find((d) => d.tmdbId === m.tmdbId)
		);
	});

	const available = radarrMovies.then(async (movies) => {
		const downloadingMovies = await downloading;
		const unavailableMovies = await unavailable;

		if (!downloadingMovies || !movies) return [];

		return movies
			.filter((movie) => {
				return !downloadingMovies.find((downloadingMovie) => downloadingMovie.tmdbId === movie.id);
			})
			.filter(
				(movie) => !unavailableMovies?.find((unavailableMovie) => unavailableMovie.id === movie.id)
			);
	});

	return {
		streamed: {
			available,
			downloading,
			unavailable
		}
	};
}) satisfies PageServerLoad;
