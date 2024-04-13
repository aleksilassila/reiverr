import { formatMinutesToTime } from '../../utils';
import type { tmdbApi } from '../../apis/tmdb/tmdb-api';

export type RatingSource = 'tmdb'; // TODO: Add more rating sources & move elsewhere

export type ShowcaseItemProps = {
	posterUrl: string;
	backdropUrl: string;

	trailerUrl?: string;

	title: string;
	overview?: string;
	year?: number;
	runtime?: string;
	rating?: string;
	ratingSource?: RatingSource;
	genres: string[];
	url?: string;
};

export async function getShowcasePropsFromTmdbMovie(
	response: Awaited<ReturnType<typeof tmdbApi.getPopularMovies>>
): Promise<ShowcaseItemProps[]> {
	return response.slice(0, 10).map((movie) => ({
		title: movie.title || '',
		posterUrl: movie.poster_path || '',
		backdropUrl: movie.backdrop_path || '',
		rating: movie.vote_average?.toFixed(1) || '0',
		genres: [], //(movie as any)?.genres?.map((genre: any) => genre?.name),
		year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
		runtime: formatMinutesToTime((movie as any).runtime || 0),
		ratingSource: 'tmdb',
		trailerUrl: '',
		url: `https://www.themoviedb.org/movie/${movie.id}`,
		overview: movie.overview || ''
	}));
}

export async function getShowcasePropsFromTmdbSeries(
	response: Awaited<ReturnType<typeof tmdbApi.getPopularSeries>>
): Promise<ShowcaseItemProps[]> {
	return response.slice(0, 10).map((movie) => ({
		title: movie.name || '',
		posterUrl: movie.poster_path || '',
		backdropUrl: movie.backdrop_path || '',
		rating: movie.vote_average?.toFixed(1) || '0',
		genres: [], //(movie as any)?.genres?.map((genre: any) => genre?.name),
		year: movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : undefined,
		runtime: formatMinutesToTime((movie as any).runtime || 0),
		ratingSource: 'tmdb',
		trailerUrl: '',
		url: `https://www.themoviedb.org/movie/${movie.id}`,
		overview: movie.overview || ''
	}));
}
