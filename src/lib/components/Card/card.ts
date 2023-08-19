import type { TmdbMovie2, TmdbSeries2 } from '$lib/apis/tmdb/tmdbApi';
import {
	TMDB_MOVIE_GENRES,
	TMDB_SERIES_GENRES,
	getTmdbMovieBackdrop,
	getTmdbSeriesBackdrop
} from '$lib/apis/tmdb/tmdbApi';
import type { ComponentProps } from 'svelte';
import type Card from './Card.svelte';
import { TMDB_BACKDROP_SMALL } from '$lib/constants';

export const fetchCardTmdbMovieProps = async (movie: TmdbMovie2): Promise<ComponentProps<Card>> => {
	const backdropUri = await getTmdbMovieBackdrop(movie.id || 0);

	const movieAny = movie as any;
	const genres =
		movie.genres?.map((g) => g.name || '') ||
		movieAny?.genre_ids?.map(
			(id: number) => TMDB_MOVIE_GENRES.find((g) => g.id === id)?.name || ''
		) ||
		[];

	return {
		tmdbId: movie.id || 0,
		title: movie.title || '',
		genres,
		runtimeMinutes: movie.runtime,
		backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
		rating: movie.vote_average || 0
	};
};

export const fetchCardTmdbSeriesProps = async (
	series: TmdbSeries2
): Promise<ComponentProps<Card>> => {
	const backdropUri = await getTmdbSeriesBackdrop(series.id || 0);

	const seriesAny = series as any;
	const genres =
		series.genres?.map((g) => g.name || '') ||
		seriesAny?.genre_ids?.map(
			(id: number) => TMDB_SERIES_GENRES.find((g) => g.id === id)?.name || ''
		) ||
		[];

	return {
		tmdbId: series.id || 0,
		title: series.name || '',
		genres,
		runtimeMinutes: series.episode_run_time?.[0],
		backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
		rating: series.vote_average || 0,
		type: 'series'
	};
};

export const fetchCardTmdbProps = async (
	item: TmdbSeries2 | TmdbMovie2
): Promise<ComponentProps<Card>> => {
	if ('name' in item) return fetchCardTmdbSeriesProps(item);
	return fetchCardTmdbMovieProps(item);
};
