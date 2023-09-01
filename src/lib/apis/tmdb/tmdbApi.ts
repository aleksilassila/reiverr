import { browser } from '$app/environment';
import { TMDB_API_KEY } from '$lib/constants';
import { settings } from '$lib/stores/settings.store';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import type { operations, paths } from './tmdb.generated';

const CACHE_ONE_DAY = 'max-age=86400';
const CACHE_FOUR_DAYS = 'max-age=345600';

export type TmdbMovie2 =
	operations['movie-details']['responses']['200']['content']['application/json'];
export type TmdbSeries2 =
	operations['tv-series-details']['responses']['200']['content']['application/json'];
export type TmdbSeason =
	operations['tv-season-details']['responses']['200']['content']['application/json'];

export interface TmdbMovieFull2 extends TmdbMovie2 {
	videos: operations['movie-videos']['responses']['200']['content']['application/json'];
	credits: operations['movie-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['movie-external-ids']['responses']['200']['content']['application/json'];
	images: operations['movie-images']['responses']['200']['content']['application/json'];
}

export interface TmdbSeriesFull2 extends TmdbSeries2 {
	videos: operations['tv-series-videos']['responses']['200']['content']['application/json'];
	aggregate_credits: operations['tv-series-aggregate-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['tv-series-external-ids']['responses']['200']['content']['application/json'];
	images: operations['tv-series-images']['responses']['200']['content']['application/json'];
}

const backdropCache = browser ? window?.caches?.open('backdrops') : undefined;
const posterCache = browser ? window?.caches?.open('posters') : undefined;

const getTmdbCache = async (
	cachePromise: typeof backdropCache,
	tmdbId: number,
	fn: () => Promise<string | undefined>
) => {
	const cache = await cachePromise;

	if (cache) {
		const cacheRes = await cache.match(String(tmdbId));
		if (cacheRes) return cacheRes.text();
		else {
			const backdropUri = await fn();
			if (backdropUri) {
				cache.put(String(tmdbId), new Response(backdropUri));
			}
			return backdropUri;
		}
	} else {
		return fn();
	}
};

export const TmdbApiOpen = createClient<paths>({
	baseUrl: 'https://api.themoviedb.org',
	headers: {
		Authorization: `Bearer ${TMDB_API_KEY}`
	}
});

export const getTmdbMovie = async (tmdbId: number) =>
	await TmdbApiOpen.get('/3/movie/{movie_id}', {
		params: {
			path: {
				movie_id: tmdbId
			},
			query: {
				append_to_response: 'videos,credits,external_ids,images',
				...({ include_image_language: get(settings)?.language + ',en,null' } as any)
			}
		}
	}).then((res) => res.data as TmdbMovieFull2 | undefined);

export const getTmdbSeriesFromTvdbId = async (tvdbId: string) =>
	TmdbApiOpen.get('/3/find/{external_id}', {
		params: {
			path: {
				external_id: tvdbId
			},
			query: {
				external_source: 'tvdb_id'
			}
		},
		headers: {
			'Cache-Control': CACHE_ONE_DAY
		}
	}).then((res) => res.data?.tv_results?.[0] as TmdbSeries2 | undefined);

export const getTmdbIdFromTvdbId = async (tvdbId: number) =>
	getTmdbSeriesFromTvdbId(String(tvdbId)).then((res: any) => {
		const id = res?.id as number | undefined;
		if (!id) return Promise.reject();
		return id;
	});

export const getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull2 | undefined> =>
	await TmdbApiOpen.get('/3/tv/{series_id}', {
		params: {
			path: {
				series_id: tmdbId
			},
			query: {
				append_to_response: 'videos,aggregate_credits,external_ids,images',
				...({ include_image_language: get(settings)?.language + ',en,null' } as any)
			}
		},
		headers: {
			'Cache-Control': CACHE_ONE_DAY
		}
	}).then((res) => res.data as TmdbSeriesFull2 | undefined);

export const getTmdbSeriesSeason = async (
	tmdbId: number,
	season: number
): Promise<TmdbSeason | undefined> =>
	TmdbApiOpen.get('/3/tv/{series_id}/season/{season_number}', {
		params: {
			path: {
				series_id: tmdbId,
				season_number: season
			}
		}
	}).then((res) => res.data);

export const getTmdbSeriesSeasons = async (tmdbId: number, seasons: number) =>
	Promise.all([...Array(seasons).keys()].map((i) => getTmdbSeriesSeason(tmdbId, i + 1))).then(
		(r) => r.filter((s) => s) as TmdbSeason[]
	);

export const getTmdbSeriesImages = async (tmdbId: number) =>
	TmdbApiOpen.get('/3/tv/{series_id}/images', {
		params: {
			path: {
				series_id: tmdbId
			}
		},
		headers: {
			'Cache-Control': CACHE_FOUR_DAYS // 4 days
		}
	}).then((res) => res.data);

export const getTmdbMovieImages = async (tmdbId: number) =>
	await TmdbApiOpen.get('/3/movie/{movie_id}/images', {
		params: {
			path: {
				movie_id: tmdbId
			}
		},
		headers: {
			'Cache-Control': CACHE_FOUR_DAYS // 4 days
		}
	}).then((res) => res.data);

export const getTmdbSeriesBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbSeries(tmdbId)
			.then((s) => s?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);

export const getTmdbMovieBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbMovie(tmdbId)
			.then((m) => m?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);

export const getTmdbSeriesPoster = async (tmdbId: number) =>
	getTmdbCache(posterCache, tmdbId, () => getTmdbSeries(tmdbId).then((s) => s?.poster_path));

export const getTmdbMoviePoster = async (tmdbId: number) =>
	getTmdbCache(posterCache, tmdbId, () => getTmdbMovie(tmdbId).then((m) => m?.poster_path));

/** Discover */

export const getTmdbPopularMovies = () =>
	TmdbApiOpen.get('/3/movie/popular', {
		params: {
			query: {
				language: get(settings)?.language,
				region: get(settings)?.discover.region
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbPopularSeries = () =>
	TmdbApiOpen.get('/3/tv/popular', {
		params: {
			query: {
				language: get(settings)?.language
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbNetworkSeries = (networkId: number) =>
	TmdbApiOpen.get('/3/discover/tv', {
		params: {
			query: {
				with_networks: networkId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbGenreMovies = (genreId: number) =>
	TmdbApiOpen.get('/3/discover/movie', {
		params: {
			query: {
				with_genres: String(genreId)
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesRecommendations = (tmdbId: number) =>
	TmdbApiOpen.get('/3/tv/{series_id}/recommendations', {
		params: {
			path: {
				series_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesSimilar = (tmdbId: number) =>
	TmdbApiOpen.get('/3/tv/{series_id}/similar', {
		params: {
			path: {
				series_id: String(tmdbId)
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesCredits = (tmdbId: number) =>
	TmdbApiOpen.get('/3/tv/{series_id}/credits', {
		params: {
			path: {
				series_id: tmdbId
			}
		}
	}).then((res) => res.data?.cast || []);

export const getTmdbMovieRecommendations = (tmdbId: number) =>
	TmdbApiOpen.get('/3/movie/{movie_id}/recommendations', {
		params: {
			path: {
				movie_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbMovieSimilar = (tmdbId: number) =>
	TmdbApiOpen.get('/3/movie/{movie_id}/similar', {
		params: {
			path: {
				movie_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const searchTmdbTitles = (query: string) =>
	TmdbApiOpen.get('/3/search/multi', {
		params: {
			query: {
				query
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbItemBackdrop = (item: {
	images: { backdrops: { file_path: string; iso_639_1: string }[] };
}) =>
	(
		item?.images?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
		item?.images?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
		item?.images?.backdrops?.find((b) => b.iso_639_1) ||
		item?.images?.backdrops?.[0]
	)?.file_path;

export const TMDB_MOVIE_GENRES = [
	{
		id: 28,
		name: 'Action'
	},
	{
		id: 12,
		name: 'Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 14,
		name: 'Fantasy'
	},
	{
		id: 36,
		name: 'History'
	},
	{
		id: 27,
		name: 'Horror'
	},
	{
		id: 10402,
		name: 'Music'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10749,
		name: 'Romance'
	},
	{
		id: 878,
		name: 'Science Fiction'
	},
	{
		id: 10770,
		name: 'TV Movie'
	},
	{
		id: 53,
		name: 'Thriller'
	},
	{
		id: 10752,
		name: 'War'
	},
	{
		id: 37,
		name: 'Western'
	}
];

export const TMDB_SERIES_GENRES = [
	{
		id: 10759,
		name: 'Action & Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 10762,
		name: 'Kids'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10763,
		name: 'News'
	},
	{
		id: 10764,
		name: 'Reality'
	},
	{
		id: 10765,
		name: 'Sci-Fi & Fantasy'
	},
	{
		id: 10766,
		name: 'Soap'
	},
	{
		id: 10767,
		name: 'Talk'
	},
	{
		id: 10768,
		name: 'War & Politics'
	},
	{
		id: 37,
		name: 'Western'
	}
];
