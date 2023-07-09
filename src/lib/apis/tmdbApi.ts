import axios from 'axios';
import { PUBLIC_TMDB_API_KEY } from '$env/static/public';
import { request } from '$lib/utils';

export const TmdbApi = axios.create({
	baseURL: 'https://api.themoviedb.org/3',
	headers: {
		Authorization: `Bearer ${PUBLIC_TMDB_API_KEY}`
	}
});

export const fetchTmdbMovie = async (tmdbId: string): Promise<TmdbMovie> =>
	await TmdbApi.get<TmdbMovie>('/movie/' + tmdbId).then((r) => r.data);

export const fetchTmdbMovieVideos = async (tmdbId: string): Promise<Video[]> =>
	await TmdbApi.get<VideosResponse>('/movie/' + tmdbId + '/videos').then((res) => res.data.results);

export const fetchTmdbMovieImages = async (tmdbId: string): Promise<ImagesResponse> =>
	await TmdbApi.get<ImagesResponse>('/movie/' + tmdbId + '/images').then((res) => res.data);

export const fetchTmdbMovieCredits = async (tmdbId: string): Promise<CastMember[]> =>
	await TmdbApi.get<CreditsResponse>('/movie/' + tmdbId + '/credits').then((res) => res.data.cast);

export const fetchTmdbPopularMovies = () =>
	TmdbApi.get<PopularMoviesResponse>('/movie/popular').then((res) => res.data.results);

export const requestTmdbPopularMovies = () => request(fetchTmdbPopularMovies, null);

export interface TmdbMovieFull extends TmdbMovie {
	videos: Video[];
	images: {
		backdrops: Backdrop[];
		logos: Logo[];
		posters: Poster[];
	};
	credits: CastMember[];
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
