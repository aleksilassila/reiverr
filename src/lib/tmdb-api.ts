import axios from 'axios';
import { PUBLIC_TMDB_API_KEY } from '$env/static/public';

export const TmdbApi = axios.create({
	baseURL: 'https://api.themoviedb.org/3',
	headers: {
		Authorization: `Bearer ${PUBLIC_TMDB_API_KEY}`
	}
});
