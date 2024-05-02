import axios from 'axios';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import { getTmdbSeries, tmdbApi } from '../tmdb/tmdb-api';
import type { components, paths } from './sonarr.generated';
import { log } from '../../utils';
import type { Api } from '../api.interface';
import { appState } from '../../stores/app-state.store';
import { createLocalStorageStore } from '../../stores/localstorage.store';

export type SonarrSeries = components['schemas']['SeriesResource'];
export type SonarrSeason = components['schemas']['SeasonResource'];
export type SonarrRelease = components['schemas']['ReleaseResource'];
export type EpisodeDownload = components['schemas']['QueueResource'] & { series: SonarrSeries };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type SonarrEpisode = components['schemas']['EpisodeResource'];
export type EpisodeFileResource = components['schemas']['EpisodeFileResource'];

export interface SonarrSeriesOptions {
	title: string;
	qualityProfileId: number;
	languageProfileId: number;
	seasonFolder: boolean;
	monitored: boolean;
	tvdbId: number;
	rootFolderPath: string;
	addOptions: {
		monitor:
			| 'unknown'
			| 'all'
			| 'future'
			| 'missing'
			| 'existing'
			| 'firstSeason'
			| 'latestSeason'
			| 'pilot'
			| 'monitorSpecials'
			| 'unmonitorSpecials'
			| 'none';
		searchForMissingEpisodes: boolean;
		searchForCutoffUnmetEpisodes: boolean;
	};
}

const tmdbToTvdbCache = createLocalStorageStore<Record<number, number>>('tmdb-to-tvdb-cache', {});

export class SonarrApi implements Api<paths> {
	getClient() {
		const sonarrSettings = this.getSettings();
		const baseUrl = this.getBaseUrl();
		const apiKey = sonarrSettings?.apiKey;

		return createClient<paths>({
			baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		});
	}

	getBaseUrl() {
		return get(appState)?.user?.settings?.sonarr.baseUrl || '';
	}

	getSettings() {
		return get(appState).user?.settings.sonarr;
	}

	getApiKey() {
		return get(appState).user?.settings.sonarr.apiKey;
	}

	tmdbToTvdb = async (tmdbId: number) => {
		if (!get(tmdbToTvdbCache)[tmdbId]) {
			const tvdbId = await tmdbApi
				.getTmdbSeries(tmdbId)
				.then((series) => series?.external_ids.tvdb_id || 0);
			tmdbToTvdbCache.update((prev) => ({ ...prev, [tmdbId]: tvdbId }));
			return tvdbId;
		}

		return get(tmdbToTvdbCache)[tmdbId];
	};

	getSeriesById = (id: number): Promise<SonarrSeries | undefined> =>
		this.getClient()
			?.GET('/api/v3/series/{id}', {
				params: {
					path: {
						id
					}
				}
			})
			.then((r) => r.data) || Promise.resolve(undefined);

	getAllSeries = (): Promise<SonarrSeries[]> =>
		this.getClient()
			?.GET('/api/v3/series', {
				params: {}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	getSonarrSeriesByTvdbId = (tvdbId: number): Promise<SonarrSeries | undefined> =>
		this.getClient()
			?.GET('/api/v3/series', {
				params: {
					query: {
						tvdbId: tvdbId
					}
				}
			})
			.then((r) => r.data?.find((m) => m.tvdbId === tvdbId)) || Promise.resolve(undefined);

	getSeriesByTmdbId = async (tmdbId: number) =>
		this.tmdbToTvdb(tmdbId).then((tvdbId) =>
			tvdbId ? this.getSonarrSeriesByTvdbId(tvdbId) : undefined
		);

	getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
		this.getClient()
			?.GET('/api/v3/diskspace', {})
			.then((d) => d.data || []) || Promise.resolve([]);

	addSeriesToSonarr = async (tmdbId: number) => {
		const tmdbSeries = await getTmdbSeries(tmdbId);

		if (!tmdbSeries || !tmdbSeries.external_ids.tvdb_id || !tmdbSeries.name)
			throw new Error('Movie not found');

		const options: SonarrSeriesOptions = {
			title: tmdbSeries.name,
			tvdbId: tmdbSeries.external_ids.tvdb_id,
			qualityProfileId: this.getSettings()?.qualityProfileId || 0,
			monitored: false,
			addOptions: {
				monitor: 'none',
				searchForMissingEpisodes: false,
				searchForCutoffUnmetEpisodes: false
			},
			rootFolderPath: this.getSettings()?.rootFolderPath || '',
			languageProfileId: this.getSettings()?.languageProfileId || 0,
			seasonFolder: true
		};

		return this.getClient()
			?.POST('/api/v3/series', {
				params: {},
				body: options
			})
			.then((r) => r.data);
	};

	cancelDownload = async (downloadId: number) => {
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

	downloadSonarrRelease = (guid: string, indexerId: number) =>
		this.getClient()
			?.POST('/api/v3/release', {
				params: {},
				body: {
					indexerId,
					guid
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	deleteSonarrEpisode = (id: number) =>
		this.getClient()
			?.DELETE('/api/v3/episodefile/{id}', {
				params: {
					path: {
						id
					}
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	deleteSonarrEpisodes = (ids: number[]) =>
		this.getClient()
			?.DELETE('/api/v3/episodefile/bulk', {
				body: {
					episodeFileIds: ids
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	getSonarrDownloads = (): Promise<EpisodeDownload[]> =>
		this.getClient()
			?.GET('/api/v3/queue', {
				params: {
					query: {
						includeEpisode: true,
						includeSeries: true
					}
				}
			})
			.then(
				(r) =>
					(r.data?.records?.filter(
						(record) => record.episode && record.series
					) as EpisodeDownload[]) || []
			) || Promise.resolve([]);

	getDownloadsBySeriesId = (sonarrId: number) =>
		this.getSonarrDownloads().then((downloads) =>
			downloads.filter((d) => d.seriesId === sonarrId)
		) || Promise.resolve([]);

	removeFromSonarr = (id: number): Promise<boolean> =>
		this.getClient()
			?.DELETE('/api/v3/series/{id}', {
				params: {
					path: {
						id
					}
				}
			})
			.then((res) => res.response.ok) || Promise.resolve(false);

	getFilesBySeriesId = (seriesId: number): Promise<EpisodeFileResource[]> =>
		this.getClient()
			?.GET('/api/v3/episodefile', {
				params: {
					query: {
						seriesId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	// getSonarrEpisodes = async (seriesId: number) => {
	// 	const episodesPromise =
	// 		this.getClient()
	// 			?.GET('/api/v3/episode', {
	// 				params: {
	// 					query: {
	// 						seriesId
	// 					}
	// 				}
	// 			})
	// 			.then((r) => r.data || []) || Promise.resolve([]);
	//
	// 	const episodeFilesPromise =
	// 		this.getClient()
	// 			?.GET('/api/v3/episodefile', {
	// 				params: {
	// 					query: {
	// 						seriesId
	// 					}
	// 				}
	// 			})
	// 			.then((r) => r.data || []) || Promise.resolve([]);
	//
	// 	const episodes = await episodesPromise;
	// 	const episodeFiles = await episodeFilesPromise;
	//
	// 	return episodes.map((episode) => ({
	// 		episode,
	// 		episodeFile: episodeFiles.find((file) => file.id === episode.episodeFileId)
	// 	}));
	// };

	getEpisodeReleases = async (episodeId: number) =>
		this.getClient()
			?.GET('/api/v3/release', {
				params: {
					query: {
						episodeId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	getSeasonReleases = async (seriesId: number, seasonNumber: number) =>
		this.getClient()
			?.GET('/api/v3/release', {
				params: {
					query: {
						seriesId,
						seasonNumber
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	getEpisodes = async (seriesId: number, seasonNumber?: number): Promise<SonarrEpisode[]> => {
		return (
			this.getClient()
				?.GET('/api/v3/episode', {
					params: {
						query: {
							seriesId,
							seasonNumber
						}
					}
				})
				.then((r) => r.data || []) || Promise.resolve([])
		);
	};

	getSonarrHealth = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get((baseUrl || this.getBaseUrl()) + '/api/v3/health', {
				headers: {
					'X-Api-Key': apiKey || this.getApiKey()
				}
			})
			.then((res) => res.status === 200)
			.catch(() => false);

	getSonarrRootFolders = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get<components['schemas']['RootFolderResource'][]>(
				(baseUrl || this.getBaseUrl()) + '/api/v3/rootFolder',
				{
					headers: {
						'X-Api-Key': apiKey || this.getApiKey()
					}
				}
			)
			.then((res) => res.data || []);

	getSonarrQualityProfiles = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get<components['schemas']['QualityProfileResource'][]>(
				(baseUrl || this.getBaseUrl()) + '/api/v3/qualityprofile',
				{
					headers: {
						'X-Api-Key': apiKey || this.getApiKey()
					}
				}
			)
			.then((res) => res.data || []);

	getSonarrLanguageProfiles = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get<components['schemas']['LanguageProfileResource'][]>(
				(baseUrl || this.getBaseUrl()) + '/api/v3/languageprofile',
				{
					headers: {
						'X-Api-Key': apiKey || this.getApiKey()
					}
				}
			)
			.then((res) => res.data || []);

	getSonarrPosterUrl = (item: SonarrSeries, original = false) => {
		const url = this.getBaseUrl() + (item.images?.find((i) => i.coverType === 'poster')?.url || '');

		if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

		return url;
	};
}

export const sonarrApi = new SonarrApi();
export const sonarrApiClient = sonarrApi.getClient;

// function getSonarrApi() {
// 	const baseUrl = get(settings)?.sonarr.baseUrl;
// 	const apiKey = get(settings)?.sonarr.apiKey;
// 	const rootFolder = get(settings)?.sonarr.rootFolderPath;
// 	const qualityProfileId = get(settings)?.sonarr.qualityProfileId;
// 	const languageProfileId = get(settings)?.sonarr.languageProfileId;
//
// 	if (!baseUrl || !apiKey || !rootFolder || !qualityProfileId || !languageProfileId)
// 		return undefined;
//
// 	return createClient<paths>({
// 		baseUrl,
// 		headers: {
// 			'X-Api-Key': apiKey
// 		}
// 	});
// }
