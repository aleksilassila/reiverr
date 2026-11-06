import type {
	FulfilmentStatusDto,
	MediaFileDto,
	TorrentItemDto,
	TorrentWithItemsDto
} from '$lib/apis/reiverr/reiverr.openapi';
import {
	isRunning,
	progressOf,
	type TitleTorrents,
	type TorrentDto
} from '$lib/queries/downloads.queries';

/** The torrent item a torrent has for an episode, or for a movie with season and episode 0 */
export function torrentItemOf(
	torrent: TorrentWithItemsDto | undefined,
	season: number,
	episode: number
): TorrentItemDto | undefined {
	return torrent?.torrentItems.find(
		(torrentItem) => torrentItem.season === season && torrentItem.episode === episode
	);
}

/** A torrent that has data on the server, or that something is wanted of: selecting it downloads nothing anew */
const isOnServer = (torrent: TorrentDto) => torrent.downloadedBytes > 0 || isRunning(torrent);

/** The torrents of a title that are on the server, and the ones its files came from, by info hash */
export function getOnServer(
	torrents: TitleTorrents | undefined,
	files: { infoHash?: string }[] | undefined
): Set<string> {
	return new Set([
		...[...(torrents?.values() ?? [])].filter(isOnServer).map((torrent) => torrent.infoHash),
		...(files ?? []).flatMap((file) => (file.infoHash ? [file.infoHash] : []))
	]);
}

/** The torrent items that are on their way to the library */
const isDownloading = (torrentItem: TorrentItemDto) =>
	torrentItem.status === 'resolving' ||
	torrentItem.status === 'downloading' ||
	torrentItem.status === 'complete';

/** The torrent that downloads an episode, or a movie with season and episode 0, for anyone, with its torrent item: the one that is furthest */
export function findDownload(
	torrents: TitleTorrents | undefined,
	season: number,
	episode: number
): { torrent: TorrentDto; torrentItem: TorrentItemDto } | undefined {
	return [...(torrents?.values() ?? [])]
		.flatMap((torrent) => {
			const torrentItem = torrentItemOf(torrent, season, episode);
			return torrentItem && isDownloading(torrentItem) ? [{ torrent, torrentItem }] : [];
		})
		.sort((a, b) => progressOf(b.torrentItem) - progressOf(a.torrentItem))[0];
}

/** The file a request has */
export function heldFileOf(
	fulfilment: FulfilmentStatusDto | undefined,
	files: MediaFileDto[] | undefined
): MediaFileDto | undefined {
	return fulfilment?.mediaFileId
		? files?.find((file) => file.id === fulfilment.mediaFileId)
		: undefined;
}
