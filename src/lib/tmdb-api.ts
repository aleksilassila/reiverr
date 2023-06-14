import axios from 'axios';
import { PUBLIC_TMDB_API_KEY } from '$env/static/public';

export const TmdbApi = axios.create({
	baseURL: 'https://api.themoviedb.org/3',
	headers: {
		Authorization: `Bearer ${PUBLIC_TMDB_API_KEY}`
	}
});

export async function fetchMovieDetails(imdbId: string | number) {
	return {
		...(await TmdbApi.get('/movie/' + imdbId).then((res) => res.data)),
		videos: await TmdbApi.get('/movie/' + imdbId + '/videos').then((res) => res.data.results),
		credits: await TmdbApi.get('/movie/' + imdbId + '/credits').then((res) => res.data.cast)
	};
}
