import type { RadarrMovie } from '$lib/radarr/radarr';
import { fetchTmdbMovieImages } from '$lib/tmdb-api';
import type { TmdbMovie } from '$lib/tmdb-api';

export interface CardProps {
	tmdbId: string;
	title: string;
	genres: string[];
	runtimeMinutes: number;
	backdropUrl: string;
	rating: number;
}

export const fetchCardProps = async (movie: RadarrMovie): Promise<CardProps> => {
	const backdropUrl = fetchTmdbMovieImages(String(movie.tmdbId)).then(
		(r) => r.backdrops.filter((b) => b.iso_639_1 === 'en')[0].file_path
	);

	return {
		tmdbId: String(movie.tmdbId),
		title: String(movie.title),
		genres: movie.genres as string[],
		runtimeMinutes: movie.runtime as any,
		backdropUrl: await backdropUrl,
		rating: movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0
	};
};

export const fetchCardPropsTmdb = async (movie: TmdbMovie): Promise<CardProps> => {
	const backdropUrl = fetchTmdbMovieImages(String(movie.id))
		.then((r) => r.backdrops.filter((b) => b.iso_639_1 === 'en')[0]?.file_path)
		.catch(console.error);

	return {
		tmdbId: String(movie.id),
		title: String(movie.original_title),
		genres: movie.genres.map((g) => g.name),
		runtimeMinutes: movie.runtime,
		backdropUrl: (await backdropUrl) || '',
		rating: movie.vote_average || 0
	};
};
