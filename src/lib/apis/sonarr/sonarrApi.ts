import createClient from 'openapi-fetch';
import type { components, paths } from '$lib/apis/sonarr/sonarr.generated';
import { PUBLIC_SONARR_API_KEY, PUBLIC_SONARR_BASE_URL } from '$env/static/public';
import type { SeriesResource } from '$lib/types';

export type SonarrSeries = components['schemas']['SeriesResource'];
// export type MovieFileResource = components['schemas']['MovieFileResource'];
export type SonarrReleaseResource = components['schemas']['ReleaseResource'];
export type SonarrDownload = components['schemas']['QueueResource'] & { series: SonarrSeries };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];

export const SonarrApi = createClient<paths>({
	baseUrl: PUBLIC_SONARR_BASE_URL,
	headers: {
		'X-Api-Key': PUBLIC_SONARR_API_KEY
	}
});

export const getSonarrSeries = (): Promise<SeriesResource[]> =>
	SonarrApi.get('/api/v3/series', {
		params: {}
	}).then((r) => r.data || []);

export const getSonarrSeriesByTvdbId = (tvdbId: number): Promise<SeriesResource | undefined> =>
	SonarrApi.get('/api/v3/series', {
		params: {
			query: {
				tvdbId: tvdbId
			}
		}
	}).then((r) => r.data?.find((m) => m.tvdbId === tvdbId));

export const getSonarrDownloads = (): Promise<SonarrDownload[]> =>
	SonarrApi.get('/api/v3/queue', {
		params: {
			query: {
				includeSeries: true
			}
		}
	}).then((r) => (r.data?.records?.filter((record) => record.series) as SonarrDownload[]) || []);

export const getRadarrDownloadById = (sonarrId: number) =>
	getSonarrDownloads().then((downloads) => downloads.find((d) => d.series.id === sonarrId));

export const getDiskSpace = (): Promise<DiskSpaceInfo[]> =>
	SonarrApi.get('/api/v3/diskspace', {}).then((d) => d.data || []);
