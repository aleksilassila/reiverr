import type {
	DownloadSettingsDto,
	TorrentItemDto,
	TorrentWithItemsDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { queryClient, type MediaType } from './query-client';

/** A torrent as the engine has it, without its torrent items */
export type TorrentDto = Omit<TorrentWithItemsDto, 'torrentItems'>;

/** The torrents of a title as the engine has them, by info hash */
export type TitleTorrents = Map<string, TorrentWithItemsDto>;

/** How often the torrents of a title are fetched: while one runs, else only when the server says they changed */
export const LIVE_REFRESH_INTERVAL = 3000;

const toTitleTorrents = (torrents: TorrentWithItemsDto[]): TitleTorrents =>
	new Map(torrents.map((torrent) => [torrent.infoHash, torrent]));

export const isRunning = (torrent: TorrentDto) =>
	torrent.status === 'starting' || torrent.status === 'downloading' || torrent.status === 'seeding';

function liveRefetchInterval(query: { state: { data?: TorrentWithItemsDto[] } }): number | false {
	return query.state.data?.some(isRunning) ? LIVE_REFRESH_INTERVAL : false;
}

export const progressOf = (torrentItem: TorrentItemDto) =>
	torrentItem.status === 'complete' ? 1 : (torrentItem.progress ?? 0);

export const downloadsKeys = {
	all: ['downloads'] as const,
	settings: () => [...downloadsKeys.all, 'settings'] as const,
	/** The torrents of a title as the engine has them */
	torrents: (mediaType: MediaType, tmdbId: string) =>
		[...downloadsKeys.all, 'torrents', mediaType, tmdbId] as const
};

export const downloadsQueries = {
	settings: () =>
		queryOptions({
			queryKey: downloadsKeys.settings(),
			queryFn: () => reiverrApi.downloads.getDownloadSettings().then((r) => r.data)
		}),
	/** The torrents of the series, live: polled while one runs, told by the server otherwise */
	seriesTorrents: (tmdbId: string) =>
		queryOptions({
			queryKey: downloadsKeys.torrents('series', tmdbId),
			queryFn: () => reiverrApi.downloads.getSeriesTorrents(tmdbId).then((r) => r.data),
			select: toTitleTorrents,
			refetchInterval: liveRefetchInterval
		}),
	/** The torrents of the movie, live: polled while one runs, told by the server otherwise */
	movieTorrents: (tmdbId: string) =>
		queryOptions({
			queryKey: downloadsKeys.torrents('movie', tmdbId),
			queryFn: () => reiverrApi.downloads.getMovieTorrents(tmdbId).then((r) => r.data),
			select: toTitleTorrents,
			refetchInterval: liveRefetchInterval
		})
};

export async function updateDownloadSettings(settings: DownloadSettingsDto) {
	const saved = await reiverrApi.downloads.updateDownloadSettings(settings).then((r) => r.data);
	queryClient.setQueryData(downloadsKeys.settings(), saved);
	return saved;
}
