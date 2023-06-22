import type { PageServerLoad } from './$types';
import { fetchTmdbMovie, fetchTmdbPopularMovies } from '$lib/tmdb-api';
import { fetchCardPropsTmdb } from '../components/Card/card';

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
