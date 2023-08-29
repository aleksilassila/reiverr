import type { components, paths } from '$lib/apis/sonarr/sonarr.generated';
import { settings } from '$lib/stores/settings.store';
import { log } from '$lib/utils';
import axios from 'axios';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import { getTmdbSeries } from '../tmdb/tmdbApi';

export type SonarrSeries = components['schemas']['SeriesResource'];
export type SonarrReleaseResource = components['schemas']['ReleaseResource'];
export type SonarrDownload = components['schemas']['QueueResource'] & { series: SonarrSeries };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type SonarrEpisode = components['schemas']['EpisodeResource'];

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

function getSonarrApi() {
	const baseUrl = get(settings)?.sonarr.baseUrl;
	const apiKey = get(settings)?.sonarr.apiKey;
	const rootFolder = get(settings)?.sonarr.rootFolderPath;
	const qualityProfileId = get(settings)?.sonarr.qualityProfileId;
	const languageProfileId = get(settings)?.sonarr.languageProfileId;

	if (!baseUrl || !apiKey || !rootFolder || !qualityProfileId || !languageProfileId)
		return undefined;

	return createClient<paths>({
		baseUrl,
		headers: {
			'X-Api-Key': apiKey
		}
	});
}

export const getSonarrSeries = (): Promise<SonarrSeries[]> =>
	getSonarrApi()
		?.get('/api/v3/series', {
			params: {}
		})
		.then((r) => r.data || []) || Promise.resolve([]);

export const getSonarrSeriesByTvdbId = (tvdbId: number): Promise<SonarrSeries | undefined> =>
	getSonarrApi()
		?.get('/api/v3/series', {
			params: {
				query: {
					tvdbId: tvdbId
				}
			}
		})
		.then((r) => r.data?.find((m) => m.tvdbId === tvdbId)) || Promise.resolve(undefined);

export const getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
	getSonarrApi()
		?.get('/api/v3/diskspace', {})
		.then((d) => d.data || []) || Promise.resolve([]);

export const addSeriesToSonarr = async (tmdbId: number) => {
	const tmdbSeries = await getTmdbSeries(tmdbId);

	if (!tmdbSeries || !tmdbSeries.external_ids.tvdb_id || !tmdbSeries.name)
		throw new Error('Movie not found');

	const options: SonarrSeriesOptions = {
		title: tmdbSeries.name,
		tvdbId: tmdbSeries.external_ids.tvdb_id,
		qualityProfileId: get(settings)?.sonarr.qualityProfileId || 0,
		monitored: false,
		addOptions: {
			monitor: 'none',
			searchForMissingEpisodes: false,
			searchForCutoffUnmetEpisodes: false
		},
		rootFolderPath: get(settings)?.sonarr.rootFolderPath || '',
		languageProfileId: get(settings)?.sonarr.languageProfileId || 0,
		seasonFolder: true
	};

	return getSonarrApi()
		?.post('/api/v3/series', {
			params: {},
			body: options
		})
		.then((r) => r.data);
};

export const cancelDownloadSonarrEpisode = async (downloadId: number) => {
	const deleteResponse = await getSonarrApi()
		?.del('/api/v3/queue/{id}', {
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

export const downloadSonarrEpisode = (guid: string, indexerId: number) =>
	getSonarrApi()
		?.post('/api/v3/release', {
			params: {},
			body: {
				indexerId,
				guid
			}
		})
		.then((res) => res.response.ok) || Promise.resolve(false);

export const deleteSonarrEpisode = (id: number) =>
	getSonarrApi()
		?.del('/api/v3/episodefile/{id}', {
			params: {
				path: {
					id
				}
			}
		})
		.then((res) => res.response.ok) || Promise.resolve(false);

export const getSonarrDownloads = (): Promise<SonarrDownload[]> =>
	getSonarrApi()
		?.get('/api/v3/queue', {
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
				) as SonarrDownload[]) || []
		) || Promise.resolve([]);

export const getSonarrDownloadsById = (sonarrId: number) =>
	getSonarrDownloads().then((downloads) => downloads.filter((d) => d.seriesId === sonarrId)) ||
	Promise.resolve([]);

export const removeFromSonarr = (id: number): Promise<boolean> =>
	getSonarrApi()
		?.del('/api/v3/series/{id}', {
			params: {
				path: {
					id
				}
			}
		})
		.then((res) => res.response.ok) || Promise.resolve(false);

export const getSonarrEpisodes = async (seriesId: number) => {
	const episodesPromise =
		getSonarrApi()
			?.get('/api/v3/episode', {
				params: {
					query: {
						seriesId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	const episodeFilesPromise =
		getSonarrApi()
			?.get('/api/v3/episodefile', {
				params: {
					query: {
						seriesId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([]);

	const episodes = await episodesPromise;
	const episodeFiles = await episodeFilesPromise;

	return episodes.map((episode) => ({
		episode,
		episodeFile: episodeFiles.find((file) => file.id === episode.episodeFileId)
	}));
};

export const fetchSonarrReleases = async (episodeId: number) =>
	getSonarrApi()
		?.get('/api/v3/release', {
			params: {
				query: {
					episodeId
				}
			}
		})
		.then((r) => r.data || []) || Promise.resolve([]);

export const fetchSonarrSeasonReleases = async (seriesId: number, seasonNumber: number) =>
	getSonarrApi()
		?.get('/api/v3/release', {
			params: {
				query: {
					seriesId,
					seasonNumber
				}
			}
		})
		.then((r) => r.data || []) || Promise.resolve([]);

export const fetchSonarrEpisodes = async (seriesId: number): Promise<SonarrEpisode[]> => {
	return (
		getSonarrApi()
			?.get('/api/v3/episode', {
				params: {
					query: {
						seriesId
					}
				}
			})
			.then((r) => r.data || []) || Promise.resolve([])
	);
};

export const getSonarrHealth = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) =>
	axios
		.get((baseUrl || get(settings)?.sonarr.baseUrl) + '/api/v3/health', {
			headers: {
				'X-Api-Key': apiKey || get(settings)?.sonarr.apiKey
			}
		})
		.then((res) => res.status === 200)
		.catch(() => false);

export const getSonarrRootFolders = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) =>
	axios
		.get<components['schemas']['RootFolderResource'][]>(
			(baseUrl || get(settings)?.sonarr.baseUrl) + '/api/v3/rootFolder',
			{
				headers: {
					'X-Api-Key': apiKey || get(settings)?.sonarr.apiKey
				}
			}
		)
		.then((res) => res.data || []);

export const getSonarrQualityProfiles = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) =>
	axios
		.get<components['schemas']['QualityProfileResource'][]>(
			(baseUrl || get(settings)?.sonarr.baseUrl) + '/api/v3/qualityprofile',
			{
				headers: {
					'X-Api-Key': apiKey || get(settings)?.sonarr.apiKey
				}
			}
		)
		.then((res) => res.data || []);

export const getSonarrLanguageProfiles = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) =>
	axios
		.get<components['schemas']['LanguageProfileResource'][]>(
			(baseUrl || get(settings)?.sonarr.baseUrl) + '/api/v3/languageprofile',
			{
				headers: {
					'X-Api-Key': apiKey || get(settings)?.sonarr.apiKey
				}
			}
		)
		.then((res) => res.data || []);

export function getSonarrPosterUrl(item: SonarrSeries, original = false) {
	const url =
		get(settings).sonarr.baseUrl + (item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}
