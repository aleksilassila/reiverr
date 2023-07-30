import type { RadarrMovie } from '$lib/apis/radarr/radarrApi';
import {
	fetchTmdbMovieImages,
	getTmdbMovieBackdrop,
	getTmdbMovieImages,
	getTmdbSeriesBackdrop,
	getTmdbSeriesImages
} from '$lib/apis/tmdb/tmdbApi';
import type { TmdbMovie, TmdbMovie2, TmdbSeries2 } from '$lib/apis/tmdb/tmdbApi';
import type { ComponentProps } from 'svelte';
import type Card from './Card.svelte';

export const fetchCardTmdbMovieProps = async (movie: TmdbMovie2): Promise<ComponentProps<Card>> => {
	const backdropUri = getTmdbMovieBackdrop(movie.id || 0);

	return {
		tmdbId: movie.id || 0,
		title: movie.title || '',
		genres: movie.genres?.map((g) => g.name || '') || [],
		runtimeMinutes: movie.runtime,
		backdropUri: (await backdropUri) || '',
		rating: movie.vote_average || 0
	};
};

export const fetchCardTmdbSeriesProps = async (
	series: TmdbSeries2
): Promise<ComponentProps<Card>> => {
	const backdropUri = getTmdbSeriesBackdrop(series.id || 0);

	return {
		tmdbId: series.id || 0,
		title: series.name || '',
		genres: series.genres?.map((g) => g.name || '') || [],
		runtimeMinutes: series.episode_run_time?.[0],
		backdropUri: (await backdropUri) || '',
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
