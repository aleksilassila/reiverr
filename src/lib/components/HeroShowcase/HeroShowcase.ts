import type { getTmdbPopularMovies } from '../../apis/tmdb/tmdbApi';

export type RatingSource = 'tmdb'; // TODO: Add more rating sources & move elsewhere

export type ShowcaseItemProps = {
	posterUrl: string;
	backdropUrl: string;

	trailerUrl?: string;

	title: string;
	year?: number;
	runtime?: number;
	rating?: number;
	ratingSource?: RatingSource;
	genres: string[];
};

export async function getShowcasePropsFromTmdb(
	response: Awaited<ReturnType<typeof getTmdbPopularMovies>>
): Promise<ShowcaseItemProps[]> {
	return response.slice(0, 10).map((movie) => ({
		title: movie.title || '',
		posterUrl: movie.poster_path || '',
		backdropUrl: movie.backdrop_path || '',
		rating: movie.vote_average,
		genres: [], //(movie as any)?.genres?.map((genre: any) => genre?.name),
		year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
		runtime: (movie as any).runtime || 0,
		ratingSource: 'tmdb',
		trailerUrl: ''
	}));
}
