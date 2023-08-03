import { TMDB_API_KEY } from '$lib/constants';
import { getIncludedLanguagesQuery, settings } from '$lib/stores/settings.store';
import { formatDateToYearMonthDay } from '$lib/utils';
import axios from 'axios';
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
	credits: operations['tv-series-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['tv-series-external-ids']['responses']['200']['content']['application/json'];
	images: operations['tv-series-images']['responses']['200']['content']['application/json'];
}

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
				...({ include_image_language: get(settings).language + ',en,null' } as any)
			}
		}
	}).then((res) => res.data as TmdbMovieFull2 | undefined);

export const getTmdbSeriesFromTvdbId = async (tvdbId: number) =>
	TmdbApiOpen.get('/3/find/{external_id}', {
		params: {
			path: {
				external_id: String(tvdbId)
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
	getTmdbSeriesFromTvdbId(tvdbId).then((res: any) => res?.id as number | undefined);

export const getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull2 | undefined> =>
	await TmdbApiOpen.get('/3/tv/{series_id}', {
		params: {
			path: {
				series_id: tmdbId
			},
			query: {
				append_to_response: 'videos,credits,external_ids,images',
				...({ include_image_language: get(settings).language + ',en,null' } as any)
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

export const getTmdbSeriesBackdrop = async (tmdbId: number) =>
	getTmdbSeriesImages(tmdbId).then(
		(r) =>
			(
				r?.backdrops?.find((b) => b.iso_639_1 === get(settings).language) ||
				r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
				r?.backdrops?.find((b) => b.iso_639_1) ||
				r?.backdrops?.[0]
			)?.file_path
	);

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

export const getTmdbMovieBackdrop = async (tmdbId: number) =>
	getTmdbMovieImages(tmdbId).then(
		(r) =>
			(
				r?.backdrops?.find((b) => b.iso_639_1 === get(settings).language) ||
				r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
				r?.backdrops?.find((b) => b.iso_639_1) ||
				r?.backdrops?.[0]
			)?.file_path
	);

export const getTmdbPopularMovies = () =>
	TmdbApiOpen.get('/3/movie/popular', {
		params: {
			query: {
				language: get(settings).language,
				region: get(settings).region
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbPopularSeries = () =>
	TmdbApiOpen.get('/3/tv/popular', {
		params: {
			query: {
				language: get(settings).language
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbTrendingAll = () =>
	TmdbApiOpen.get('/3/trending/all/{time_window}', {
		params: {
			path: {
				time_window: 'day'
			},
			query: {
				language: get(settings).language
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

export const getTmdbDigitalReleases = () =>
	TmdbApiOpen.get('/3/discover/movie', {
		params: {
			query: {
				with_release_type: 4,
				sort_by: 'popularity.desc',
				...getIncludedLanguagesQuery()
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbUpcomingMovies = () =>
	TmdbApiOpen.get('/3/discover/movie', {
		params: {
			query: {
				'primary_release_date.gte': formatDateToYearMonthDay(new Date()),
				sort_by: 'popularity.desc',
				...getIncludedLanguagesQuery()
			}
		}
	}).then((res) => res.data?.results || []);

export const getTrendingActors = () =>
	TmdbApiOpen.get('/3/trending/person/{time_window}', {
		params: {
			path: {
				time_window: 'week'
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbGenreMovies = (genreId: number) =>
	TmdbApiOpen.get('/3/discover/movie', {
		params: {
			query: {
				with_genres: String(genreId),
				...getIncludedLanguagesQuery()
			}
		}
	}).then((res) => res.data?.results || []);

// Deprecated hereon forward

/** @deprecated */
export const TmdbApi = axios.create({
	baseURL: 'https://api.themoviedb.org/3',
	headers: {
		Authorization: `Bearer ${TMDB_API_KEY}`
	}
});

/** @deprecated */
export const fetchTmdbMovie = async (tmdbId: string): Promise<TmdbMovie> =>
	await TmdbApi.get<TmdbMovie>('/movie/' + tmdbId).then((r) => r.data);

/** @deprecated */
export const fetchTmdbMovieVideos = async (tmdbId: string): Promise<Video[]> =>
	await TmdbApi.get<VideosResponse>('/movie/' + tmdbId + '/videos').then((res) => res.data.results);

/** @deprecated */
export const fetchTmdbMovieImages = async (tmdbId: string): Promise<ImagesResponse> =>
	await TmdbApi.get<ImagesResponse>('/movie/' + tmdbId + '/images', {
		headers: {
			'Cache-Control': CACHE_FOUR_DAYS // 4 days
		}
	}).then((res) => res.data);

/** @deprecated */
export const fetchTmdbMovieCredits = async (tmdbId: string): Promise<CastMember[]> =>
	await TmdbApi.get<CreditsResponse>('/movie/' + tmdbId + '/credits').then((res) => res.data.cast);

export interface TmdbMovieFull extends TmdbMovie {
	videos: {
		results: Video[];
	};
	// images: {
	// 	backdrops: Backdrop[];
	// 	logos: Logo[];
	// 	posters: Poster[];
	// };
	credits: {
		cast: CastMember[];
	};
}

export type MovieDetailsResponse = TmdbMovie;

export interface TmdbMovie {
	adult: boolean;
	backdrop_path: string;
	belongs_to_collection: any;
	budget: number;
	genres: Genre[];
	homepage: string;
	id: number;
	imdb_id: string;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string;
	production_companies: ProductionCompany[];
	production_countries: ProductionCountry[];
	release_date: string;
	revenue: number;
	runtime: number;
	spoken_languages: SpokenLanguage[];
	status: string;
	tagline: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
}

export interface Genre {
	id: number;
	name: string;
}

export interface ProductionCompany {
	id: number;
	logo_path?: string;
	name: string;
	origin_country: string;
}

export interface ProductionCountry {
	iso_3166_1: string;
	name: string;
}

export interface SpokenLanguage {
	english_name: string;
	iso_639_1: string;
	name: string;
}

export interface CreditsResponse {
	id: number;
	cast: CastMember[];
	crew: CrewMember[];
}

export interface CastMember {
	adult: boolean;
	gender: number;
	id: number;
	known_for_department: string;
	name: string;
	original_name: string;
	popularity: number;
	profile_path?: string;
	cast_id: number;
	character: string;
	credit_id: string;
	order: number;
}

export interface CrewMember {
	adult: boolean;
	gender: number;
	id: number;
	known_for_department: string;
	name: string;
	original_name: string;
	popularity: number;
	profile_path?: string;
	credit_id: string;
	department: string;
	job: string;
}

export interface VideosResponse {
	id: number;
	results: Video[];
}

export interface Video {
	iso_639_1: string;
	iso_3166_1: string;
	name: string;
	key: string;
	site: string;
	size: number;
	type: string;
	official: boolean;
	published_at: string;
	id: string;
}

export interface ImagesResponse {
	backdrops: Backdrop[];
	id: number;
	logos: Logo[];
	posters: Poster[];
}

export interface Backdrop {
	aspect_ratio: number;
	height: number;
	iso_639_1?: string;
	file_path: string;
	vote_average: number;
	vote_count: number;
	width: number;
}

export interface Logo {
	aspect_ratio: number;
	height: number;
	iso_639_1: string;
	file_path: string;
	vote_average: number;
	vote_count: number;
	width: number;
}

export interface Poster {
	aspect_ratio: number;
	height: number;
	iso_639_1?: string;
	file_path: string;
	vote_average: number;
	vote_count: number;
	width: number;
}

export interface MultiSearchResponse {
	page: number;
	results: MultiSearchResult[];
	total_pages: number;
	total_results: number;
}

export interface MultiSearchResult {
	adult: boolean;
	backdrop_path?: string;
	id: number;
	title: string;
	original_language: string;
	original_title: string;
	overview: string;
	poster_path?: string;
	media_type: string;
	genre_ids: number[];
	popularity: number;
	release_date: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
}

export interface PopularMoviesResponse {
	page: number;
	results: PopularMovieResult[];
	total_pages: number;
	total_results: number;
}

export interface PopularMovieResult {
	adult: boolean;
	backdrop_path: string;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string;
	release_date: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
}
