import axios from 'axios';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import { settings } from '../../stores/settings.store';
import type { components, paths } from './radarr.generated';
import { getTmdbMovie } from '../tmdb/tmdb-api';
import { log } from '../../utils';
import type { Api } from '../api.interface';
import { user } from '../../stores/user.store';

export const movieAvailabilities = [
	// 'tba',
	'announced',
	'inCinemas',
	'released'
	// 'deleted'
] as const;

export type RadarrMovie = components['schemas']['MovieResource'];
export type MovieFileResource = components['schemas']['MovieFileResource'];
export type RadarrRelease = components['schemas']['ReleaseResource'];
export type MovieDownload = components['schemas']['QueueResource'] & { movie: RadarrMovie };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type MovieHistoryResource = components['schemas']['HistoryResource'];
export type MovieAvailability = components['schemas']['MovieStatusType'];

export interface RadarrMovieOptions {
	title: string;
	qualityProfileId: number;
	minimumAvailability: MovieAvailability;
	tags: number[];
	profileId: number;
	year: number;
	rootFolderPath: string;
	tmdbId: number;
	monitored?: boolean;
	searchNow?: boolean;
}

export class RadarrApi implements Api<paths> {
	getClient() {
		const radarrSettings = get(user)?.settings.radarr;
		const baseUrl = radarrSettings?.baseUrl;
		const apiKey = radarrSettings?.apiKey;

		return createClient<paths>({
			baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		});
	}

	getBaseUrl() {
		return get(user)?.settings?.radarr.baseUrl || '';
	}

	getSettings() {
		return get(user)?.settings.radarr;
	}

	getMovieByTmdbId = (tmdbId: number): Promise<RadarrMovie | undefined> =>
		this.getClient()
			?.GET('/api/v3/movie', {
				params: {
					query: {
						tmdbId: Number(tmdbId)
					}
				}
			})
			.then((r) => r.data?.find((m) => m.tmdbId == tmdbId)) || Promise.resolve(undefined);

	getRadarrMovies = (): Promise<RadarrMovie[]> =>
		this.getClient()
			?.GET('/api/v3/movie', {
				params: {}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	addMovieToRadarr = async (
		tmdbId: number,
		_options: {
			qualityProfileId?: number;
			rootFolderPath?: string;
			minimumAvailability?: MovieAvailability;
		} = {}
	) => {
		const tmdbMovie = await getTmdbMovie(tmdbId);
		// const radarrMovie = await this.lookupRadarrMovieByTmdbId(tmdbId);
		//
		// if (radarrMovie?.id) throw new Error('Movie already exists');

		if (!tmdbMovie) throw new Error('Movie not found');

		const options: RadarrMovieOptions = {
			qualityProfileId: _options.qualityProfileId || this.getSettings()?.qualityProfileId || 0,
			profileId: _options.qualityProfileId || this.getSettings()?.qualityProfileId || 0,
			rootFolderPath: _options.rootFolderPath || this.getSettings()?.rootFolderPath || '',
			minimumAvailability: _options.minimumAvailability || 'released',
			title: tmdbMovie.title || tmdbMovie.original_title || '',
			tmdbId: tmdbMovie.id || 0,
			year: Number(tmdbMovie.release_date?.slice(0, 4)),
			monitored: false,
			tags: [],
			searchNow: false
		};

		return (
			this.getClient()
				?.POST('/api/v3/movie', {
					params: {},
					body: options
				})
				.then((r) => r.data) || Promise.resolve(undefined)
		);
	};

	cancelDownloadRadarrMovie = async (downloadId: number) => {
		const deleteResponse = await this.getClient()
			?.DELETE('/api/v3/queue/{id}', {
				params: {
					path: {
						id: downloadId
					},
					query: {
						blocklist: false,
						removeFromClient: true
					}
				}
			})
			.then((r) => log(r));

		return !!deleteResponse?.response.ok;
	};

	cancelDownloads = async (downloadIds: number[]) =>
		this.getClient()
			?.DELETE('/api/v3/queue/bulk', {
				body: {
					ids: downloadIds
				}
			})
			.then((r) => r.response.ok) || Promise.resolve(false);

	getReleases = (movieId: number): Promise<RadarrRelease[]> =>
		this.getClient()
			?.GET('/api/v3/release', { params: { query: { movieId: movieId } } })
			.then((r) => r.data || []) || Promise.resolve([]);

	getReleaseHistory = (movieId: number): Promise<MovieHistoryResource[]> =>
		this.getClient()
			?.GET('/api/v3/history/movie', {
				params: {
					query: {
						movieId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	downloadMovie = (guid: string, indexerId: number) =>
		this.getClient()
			?.POST('/api/v3/release', {
				params: {},
				body: {
					indexerId,
					guid
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	getFilesByMovieId = (movieId: number): Promise<MovieFileResource[]> =>
		this.getClient()
			?.GET('/api/v3/moviefile', {
				params: {
					query: {
						movieId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);
	deleteMovieFile = (id: number) =>
		this.getClient()
			?.DELETE('/api/v3/moviefile/{id}', {
				params: {
					path: {
						id
					}
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	deleteFiles = (ids: number[]) =>
		this.getClient()
			?.DELETE('/api/v3/moviefile/bulk', {
				body: {
					movieFileIds: ids
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	getDownloads = (): Promise<MovieDownload[]> =>
		this.getClient()
			?.GET('/api/v3/queue', {
				params: {
					query: {
						includeMovie: true
					}
				}
			})
			.then((r) => (r.data?.records?.filter((record) => record.movie) as MovieDownload[]) || []) ||
		Promise.resolve([]);

	getDownloadsById = (radarrId: number) =>
		this.getDownloads().then((downloads) => downloads.filter((d) => d.movie.id === radarrId));

	getRadarrDownloadsByTmdbId = (tmdbId: number) =>
		this.getDownloads().then((downloads) => downloads.filter((d) => d.movie.tmdbId === tmdbId));

	private lookupRadarrMovieByTmdbId = (tmdbId: number) =>
		this.getClient()
			?.GET('/api/v3/movie/lookup/tmdb', {
				params: {
					query: {
						tmdbId
					}
				}
			})
			.then((r) => r.data as unknown as RadarrMovie) || Promise.resolve(undefined);

	getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
		this.getClient()
			?.GET('/api/v3/diskspace', {})
			.then((d) => d.data || []) || Promise.resolve([]);

	removeFromRadarr = (id: number) =>
		this.getClient()
			?.DELETE('/api/v3/movie/{id}', {
				params: {
					path: {
						id
					}
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	getHealth = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get((baseUrl ?? this.getBaseUrl()) + '/api/v3/health', {
				headers: {
					'X-Api-Key': apiKey ?? this.getSettings()?.apiKey
				}
			})
			.catch((e) => e.response);

	getRootFolders = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get<components['schemas']['RootFolderResource'][]>(
				(baseUrl || this.getBaseUrl()) + '/api/v3/rootFolder',
				{
					headers: {
						'X-Api-Key': apiKey || this.getSettings()?.apiKey
					}
				}
			)
			.then((res) => res.data || []);

	getQualityProfiles = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get<components['schemas']['QualityProfileResource'][]>(
				(baseUrl || get(user)?.settings.radarr.baseUrl) + '/api/v3/qualityprofile',
				{
					headers: {
						'X-Api-Key': apiKey || get(user)?.settings.radarr.apiKey
					}
				}
			)
			.then((res) => res.data || []);

	getRadarrPosterUrl(item: RadarrMovie, original = false) {
		const url =
			get(settings).radarr.baseUrl +
			(item.images?.find((i) => i.coverType === 'poster')?.url || '');

		if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

		return url;
	}
}

export const radarrApi = new RadarrApi();
export const radarrApiClient = radarrApi.getClient;

// function getRadarrApi() {
// 	const baseUrl = get(settings)?.radarr.baseUrl;
// 	const apiKey = get(settings)?.radarr.apiKey;
// 	const rootFolder = get(settings)?.radarr.rootFolderPath;
// 	const qualityProfileId = get(settings)?.radarr.qualityProfileId;
//
// 	if (!baseUrl || !apiKey || !rootFolder || !qualityProfileId) return undefined;
//
// 	return createClient<paths>({
// 		baseUrl,
// 		headers: {
// 			'X-Api-Key': apiKey
// 		}
// 	});
// }
