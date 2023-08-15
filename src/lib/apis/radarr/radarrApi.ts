import type { components, paths } from '$lib/apis/radarr/radarr.generated';
import { getTmdbMovie } from '$lib/apis/tmdb/tmdbApi';
import { RADARR_API_KEY, RADARR_BASE_URL } from '$lib/constants';
import { settings } from '$lib/stores/settings.store';
import { log } from '$lib/utils';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';

export type RadarrMovie = components['schemas']['MovieResource'];
export type MovieFileResource = components['schemas']['MovieFileResource'];
export type ReleaseResource = components['schemas']['ReleaseResource'];
export type RadarrDownload = components['schemas']['QueueResource'] & { movie: RadarrMovie };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];

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

export const radarrAvailable = !!RADARR_BASE_URL && !!RADARR_API_KEY;

export const RadarrApi =
	RADARR_BASE_URL && RADARR_API_KEY
		? createClient<paths>({
				baseUrl: RADARR_BASE_URL,
				headers: {
					'X-Api-Key': RADARR_API_KEY
				}
		  })
		: undefined;

export const getRadarrMovies = (): Promise<RadarrMovie[]> =>
	RadarrApi?.get('/api/v3/movie', {
		params: {}
	}).then((r) => r.data || []) || Promise.resolve([]);

export const getRadarrMovieByTmdbId = (tmdbId: string): Promise<RadarrMovie | undefined> =>
	RadarrApi?.get('/api/v3/movie', {
		params: {
			query: {
				tmdbId: Number(tmdbId)
			}
		}
	}).then((r) => r.data?.find((m) => (m.tmdbId as any) == tmdbId)) || Promise.resolve(undefined);

export const addMovieToRadarr = async (tmdbId: number) => {
	const tmdbMovie = await getTmdbMovie(tmdbId);
	const radarrMovie = await lookupRadarrMovieByTmdbId(tmdbId);

	if (radarrMovie?.id) throw new Error('Movie already exists');

	if (!tmdbMovie) throw new Error('Movie not found');

	const options: RadarrMovieOptions = {
		qualityProfileId: get(settings).radarr.qualityProfileId,
		profileId: get(settings).radarr.profileId,
		rootFolderPath: get(settings).radarr.rootFolderPath,
		minimumAvailability: 'announced',
		title: tmdbMovie.title || tmdbMovie.original_title || '',
		tmdbId: tmdbMovie.id || 0,
		year: Number(tmdbMovie.release_date?.slice(0, 4)),
		monitored: false,
		tags: [],
		searchNow: false
	};

	return (
		RadarrApi?.post('/api/v3/movie', {
			params: {},
			body: options
		}).then((r) => r.data) || Promise.resolve(undefined)
	);
};

export const cancelDownloadRadarrMovie = async (downloadId: number) => {
	const deleteResponse = await RadarrApi?.del('/api/v3/queue/{id}', {
		params: {
			path: {
				id: downloadId
			},
			query: {
				blocklist: false,
				removeFromClient: true
			}
		}
	}).then((r) => log(r));

	return !!deleteResponse?.response.ok;
};

export const fetchRadarrReleases = (movieId: number) =>
	RadarrApi?.get('/api/v3/release', { params: { query: { movieId: movieId } } }).then(
		(r) => r.data || []
	) || Promise.resolve([]);

export const downloadRadarrMovie = (guid: string, indexerId: number) =>
	RadarrApi?.post('/api/v3/release', {
		params: {},
		body: {
			indexerId,
			guid
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);

export const deleteRadarrMovie = (id: number) =>
	RadarrApi?.del('/api/v3/moviefile/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);

export const getRadarrDownloads = (): Promise<RadarrDownload[]> =>
	RadarrApi?.get('/api/v3/queue', {
		params: {
			query: {
				includeMovie: true
			}
		}
	}).then((r) => (r.data?.records?.filter((record) => record.movie) as RadarrDownload[]) || []) ||
	Promise.resolve([]);

export const getRadarrDownloadsById = (radarrId: number) =>
	getRadarrDownloads().then((downloads) => downloads.filter((d) => d.movie.id === radarrId));

export const getRadarrDownloadsByTmdbId = (tmdbId: number) =>
	getRadarrDownloads().then((downloads) => downloads.filter((d) => d.movie.tmdbId === tmdbId));

const lookupRadarrMovieByTmdbId = (tmdbId: number) =>
	RadarrApi?.get('/api/v3/movie/lookup/tmdb', {
		params: {
			query: {
				tmdbId
			}
		}
	}).then((r) => r.data as any as RadarrMovie) || Promise.resolve(undefined);

export const getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
	RadarrApi?.get('/api/v3/diskspace', {}).then((d) => d.data || []) || Promise.resolve([]);

export const removeFromRadarr = (id: number) =>
	RadarrApi?.del('/api/v3/movie/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);
