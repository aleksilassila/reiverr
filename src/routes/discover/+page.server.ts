import type { PageServerLoad } from './$types';
import { fetchTmdbMovie, fetchTmdbPopularMovies } from '$lib/apis/tmdbApi';
import { fetchCardPropsTmdb } from '$lib/components/Card/card';

export const load = (() => {
	const popularMoviesPromise = fetchTmdbPopularMovies();

	const popularMovies = popularMoviesPromise.then((movies) => {
		return Promise.all(
			movies.map(async (movie) => fetchCardPropsTmdb(await fetchTmdbMovie(String(movie.id))))
		);
	});

	return {
		streamed: {
			popularMovies
		}
	};
}) satisfies PageServerLoad;
