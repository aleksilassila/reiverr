import createClient from 'openapi-fetch';
import { log, request } from '$lib/utils';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import type { components } from '$lib/apis/radarr/radarr.generated';
import { getTmdbMovie } from '$lib/apis/tmdb/tmdbApi';
import { env } from '$env/dynamic/public';
import { settings } from '$lib/stores/settings.store';
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

export const RadarrApi = createClient<paths>({
	baseUrl: env.PUBLIC_RADARR_BASE_URL,
	headers: {
		'X-Api-Key': env.PUBLIC_RADARR_API_KEY
	}
});

export const getRadarrMovies = (): Promise<RadarrMovie[]> =>
	RadarrApi.get('/api/v3/movie', {
		params: {}
	}).then((r) => r.data || []);

export const requestRadarrMovie = () => request(getRadarrMovieByTmdbId);

export const getRadarrMovieByTmdbId = (tmdbId: string): Promise<RadarrMovie | undefined> =>
	RadarrApi.get('/api/v3/movie', {
		params: {
			query: {
				tmdbId: Number(tmdbId)
			}
		}
	}).then((r) => r.data?.find((m) => (m.tmdbId as any) == tmdbId));

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

	return RadarrApi.post('/api/v3/movie', {
		params: {},
		body: options
	}).then((r) => r.data);
};

export const cancelDownloadRadarrMovie = async (downloadId: number) => {
	const deleteResponse = await RadarrApi.del('/api/v3/queue/{id}', {
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

	return deleteResponse.response.ok;
};

export const fetchRadarrReleases = (movieId: number) =>
	RadarrApi.get('/api/v3/release', { params: { query: { movieId: movieId } } }).then(
		(r) => r.data || []
	);

export const downloadRadarrMovie = (guid: string) =>
	RadarrApi.post('/api/v3/release', {
		params: {},
		body: {
			indexerId: 2,
			guid
		}
	});

export const deleteRadarrMovie = (id: number) =>
	RadarrApi.del('/api/v3/moviefile/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok);

export const getRadarrDownloads = (): Promise<RadarrDownload[]> =>
	RadarrApi.get('/api/v3/queue', {
		params: {
			query: {
				includeMovie: true
			}
		}
	}).then((r) => (r.data?.records?.filter((record) => record.movie) as RadarrDownload[]) || []);

export const getRadarrDownloadsById = (radarrId: number) =>
	getRadarrDownloads().then((downloads) => downloads.filter((d) => d.movie.id === radarrId));

export const getRadarrDownloadsByTmdbId = (tmdbId: number) =>
	getRadarrDownloads().then((downloads) => downloads.filter((d) => d.movie.tmdbId === tmdbId));

const lookupRadarrMovieByTmdbId = (tmdbId: number) =>
	RadarrApi.get('/api/v3/movie/lookup/tmdb', {
		params: {
			query: {
				tmdbId
			}
		}
	}).then((r) => r.data as any as RadarrMovie);

export const getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
	RadarrApi.get('/api/v3/diskspace', {}).then((d) => d.data || []);

export const removeFromRadarr = (id: number) =>
	RadarrApi.del('/api/v3/movie/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok);
