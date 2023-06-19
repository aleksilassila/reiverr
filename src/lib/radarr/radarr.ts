import createClient from 'openapi-fetch';
import { PUBLIC_RADARR_API_KEY } from '$env/static/public';
import { request } from '$lib/utils';
import type { paths } from '$lib/radarr/radarr-types';
import type { components } from '$lib/radarr/radarr-types';
import type { TmdbMovie, TmdbMovieFull } from '$lib/tmdb-api';
import { fetchTmdbMovie, TmdbApi } from '$lib/tmdb-api';

export type MovieResource = components['schemas']['MovieResource'];
export type MovieFileResource = components['schemas']['MovieFileResource'];
export type ReleaseResource = components['schemas']['ReleaseResource'];

export interface RadarrMovieOptions {
	title: string;
	qualityProfileId: number;
	minimumAvailability: 'announced' | 'inCinemas' | 'released';
	tags: number[];
	profileId: number;
	year: number;
	rootFolderPath: string;
	tmdbId: number;
	monitored?: boolean;
	searchNow?: boolean;
}

export const RadarrApi = createClient<paths>({
	baseUrl: 'http://radarr.home',
	headers: {
		'X-Api-Key': PUBLIC_RADARR_API_KEY
	}
});

export const getRadarrMovie = () =>
	request((tmdbId: string) =>
		RadarrApi.get('/api/v3/movie', {
			params: {
				query: {
					tmdbId: Number(tmdbId)
				}
			}
		}).then((r) => r.data?.find((m) => (m.tmdbId as any) == tmdbId))
	);

export const addRadarrMovie = () =>
	request(async (tmdbId: string) => {
		const tmdbMovie = await fetchTmdbMovie(tmdbId);
		const radarrMovie = await getMovieByTmdbIdByTmdbId(tmdbId);
		console.log('fetched movies', tmdbMovie, radarrMovie);

		if (radarrMovie?.id) throw new Error('Movie already exists');

		if (!tmdbMovie) throw new Error('Movie not found');

		const qualityProfile = 4;
		const options: RadarrMovieOptions = {
			qualityProfileId: qualityProfile,
			profileId: qualityProfile,
			rootFolderPath: '/movies',
			minimumAvailability: 'announced',
			title: tmdbMovie.title,
			tmdbId: tmdbMovie.id,
			year: Number((await tmdbMovie).release_date.slice(0, 4)),
			monitored: false,
			tags: [],
			searchNow: false
		};

		return RadarrApi.post('/api/v3/movie', {
			params: {},
			body: options
		}).then((r) => r.data);
	});

export const getReleases = () =>
	request((movieId: string) =>
		RadarrApi.get('/api/v3/release', { params: { query: { movieId: Number(movieId) } } }).then(
			(r) => r.data
		)
	);

export const queueRelease = () =>
	request((guid: string) =>
		RadarrApi.post('/api/v3/release', {
			params: {},
			body: {
				indexerId: 2,
				guid
			}
		})
	);

export const getQueuedById = () =>
	request((id: string) =>
		getQueue().then((queue) => queue?.records?.filter((r) => (r?.movie?.id as any) == id))
	);

const getQueue = () =>
	RadarrApi.get('/api/v3/queue', {
		params: {
			query: {
				includeMovie: true
			}
		}
	}).then((r) => r.data);

const getMovieByTmdbIdByTmdbId = (tmdbId: string) =>
	RadarrApi.get('/api/v3/movie/lookup/tmdb', {
		params: {
			query: {
				tmdbId: Number(tmdbId)
			}
		}
	}).then((r) => r.data as any as MovieResource);
