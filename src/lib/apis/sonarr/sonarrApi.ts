import type { components, paths } from '$lib/apis/sonarr/sonarr.generated';
import { log } from '$lib/utils';
import createClient from 'openapi-fetch';
import { getTmdbSeries } from '../tmdb/tmdbApi';
import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings.store';
import { SONARR_API_KEY, SONARR_BASE_URL } from '$lib/constants';

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

export const sonarrAvailable = !!SONARR_BASE_URL && !!SONARR_API_KEY;

export const SonarrApi =
	SONARR_BASE_URL && SONARR_API_KEY
		? createClient<paths>({
				baseUrl: SONARR_BASE_URL,
				headers: {
					'X-Api-Key': SONARR_API_KEY
				}
		  })
		: undefined;

export const getSonarrSeries = (): Promise<SonarrSeries[]> =>
	SonarrApi?.get('/api/v3/series', {
		params: {}
	}).then((r) => r.data || []) || Promise.resolve([]);

export const getSonarrSeriesByTvdbId = (tvdbId: number): Promise<SonarrSeries | undefined> =>
	SonarrApi?.get('/api/v3/series', {
		params: {
			query: {
				tvdbId: tvdbId
			}
		}
	}).then((r) => r.data?.find((m) => m.tvdbId === tvdbId)) || Promise.resolve(undefined);

export const getRadarrDownloadById = (sonarrId: number) =>
	getSonarrDownloads().then((downloads) => downloads.find((d) => d.series.id === sonarrId)) ||
	Promise.resolve(undefined);

export const getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
	SonarrApi?.get('/api/v3/diskspace', {}).then((d) => d.data || []) || Promise.resolve([]);

export const addSeriesToSonarr = async (tmdbId: number) => {
	const tmdbSeries = await getTmdbSeries(tmdbId);

	if (!tmdbSeries || !tmdbSeries.external_ids.tvdb_id || !tmdbSeries.name)
		throw new Error('Movie not found');

	const options: SonarrSeriesOptions = {
		title: tmdbSeries.name,
		tvdbId: tmdbSeries.external_ids.tvdb_id,
		qualityProfileId: get(settings).sonarr.qualityProfileId,
		monitored: false,
		addOptions: {
			monitor: 'none',
			searchForMissingEpisodes: false,
			searchForCutoffUnmetEpisodes: false
		},
		rootFolderPath: get(settings).sonarr.rootFolderPath,
		languageProfileId: get(settings).sonarr.languageProfileId,
		seasonFolder: true
	};

	return SonarrApi?.post('/api/v3/series', {
		params: {},
		body: options
	}).then((r) => r.data);
};

export const cancelDownloadSonarrEpisode = async (downloadId: number) => {
	const deleteResponse = await SonarrApi?.del('/api/v3/queue/{id}', {
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

export const downloadSonarrEpisode = (guid: string, indexerId: number) =>
	SonarrApi?.post('/api/v3/release', {
		params: {},
		body: {
			indexerId,
			guid
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);

export const deleteSonarrEpisode = (id: number) =>
	SonarrApi?.del('/api/v3/episodefile/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);

export const getSonarrDownloads = (): Promise<SonarrDownload[]> =>
	SonarrApi?.get('/api/v3/queue', {
		params: {
			query: {
				includeEpisode: true,
				includeSeries: true
			}
		}
	}).then(
		(r) =>
			(r.data?.records?.filter((record) => record.episode && record.series) as SonarrDownload[]) ||
			[]
	) || Promise.resolve([]);

export const getSonarrDownloadsById = (sonarrId: number) =>
	getSonarrDownloads().then((downloads) => downloads.filter((d) => d.seriesId === sonarrId)) ||
	Promise.resolve([]);

export const removeFromSonarr = (id: number): Promise<boolean> =>
	SonarrApi?.del('/api/v3/series/{id}', {
		params: {
			path: {
				id
			}
		}
	}).then((res) => res.response.ok) || Promise.resolve(false);

export const getSonarrEpisodes = async (seriesId: number) => {
	const episodesPromise =
		SonarrApi?.get('/api/v3/episode', {
			params: {
				query: {
					seriesId
				}
			}
		}).then((r) => r.data || []) || Promise.resolve([]);

	const episodeFilesPromise =
		SonarrApi?.get('/api/v3/episodefile', {
			params: {
				query: {
					seriesId
				}
			}
		}).then((r) => r.data || []) || Promise.resolve([]);

	const episodes = await episodesPromise;
	const episodeFiles = await episodeFilesPromise;

	return episodes.map((episode) => ({
		episode,
		episodeFile: episodeFiles.find((file) => file.id === episode.episodeFileId)
	}));
};

export const fetchSonarrReleases = async (episodeId: number) =>
	SonarrApi?.get('/api/v3/release', {
		params: {
			query: {
				episodeId
			}
		}
	}).then((r) => r.data || []) || Promise.resolve([]);

export const fetchSonarrSeasonReleases = async (seriesId: number, seasonNumber: number) =>
	SonarrApi?.get('/api/v3/release', {
		params: {
			query: {
				seriesId,
				seasonNumber
			}
		}
	}).then((r) => r.data || []) || Promise.resolve([]);

export const fetchSonarrEpisodes = async (seriesId: number): Promise<SonarrEpisode[]> => {
	return (
		SonarrApi?.get('/api/v3/episode', {
			params: {
				query: {
					seriesId
				}
			}
		}).then((r) => r.data || []) || Promise.resolve([])
	);
};
