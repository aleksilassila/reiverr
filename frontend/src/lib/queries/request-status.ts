import type {
	FulfilmentStatusDto,
	MediaFileDto,
	MediaRequestDto,
	PreferenceDto,
	TorrentItemDto,
	TorrentWithItemsDto
} from '$lib/apis/reiverr/reiverr.openapi';

/** A torrent as the engine has it, without its torrent items */
export type TorrentDto = Omit<TorrentWithItemsDto, 'torrentItems'>;

/** The torrents of a title as the engine has them, by info hash */
export type TitleTorrents = Map<string, TorrentWithItemsDto>;

/** An episode or a movie as the requests, the status and the torrents of its title say */
export type MediaStatus = {
	request?: MediaRequestDto;
	/** The source of the request: the release or the file the user picked for it */
	preference?: PreferenceDto;
	fulfilment?: FulfilmentStatusDto;
	/** The files of the episode or the movie */
	files: MediaFileDto[];
	/** The torrent the request downloads from */
	torrent?: TorrentDto;
	/** The torrent item of the episode or the movie */
	torrentItem?: TorrentItemDto;
};

/** How often the torrents of a title are fetched: while one runs, else only when the server says they changed */
export const LIVE_REFRESH_INTERVAL = 3000;

export const toTitleTorrents = (torrents: TorrentWithItemsDto[]): TitleTorrents =>
	new Map(torrents.map((torrent) => [torrent.infoHash, torrent]));

const isRunning = (torrent: TorrentDto) =>
	torrent.status === 'starting' || torrent.status === 'downloading' || torrent.status === 'seeding';

export function liveRefetchInterval(query: {
	state: { data?: TorrentWithItemsDto[] };
}): number | false {
	return query.state.data?.some(isRunning) ? LIVE_REFRESH_INTERVAL : false;
}

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
export const isOnServer = (torrent: TorrentDto) =>
	torrent.downloadedBytes > 0 || isRunning(torrent);

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

function formatTimeUntil(date: string): string {
	const hours = Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 3_600_000));
	const days = Math.round(hours / 24);

	if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
	return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}

const progressOf = (torrentItem?: TorrentItemDto) =>
	torrentItem?.status === 'complete' ? 1 : (torrentItem?.progress ?? 0);

/** The file a request has */
export function heldFileOf(
	fulfilment: FulfilmentStatusDto | undefined,
	files: MediaFileDto[] | undefined
): MediaFileDto | undefined {
	return fulfilment?.mediaFileId
		? files?.find((file) => file.id === fulfilment.mediaFileId)
		: undefined;
}

/** Whether the torrent item the request waits for cannot give it the file */
const isTorrentItemFailed = ({ fulfilment, torrentItem }: MediaStatus) =>
	fulfilment?.status === 'downloading' &&
	(torrentItem?.status === 'failed' || torrentItem?.status === 'no-match');

/** The line the pages show of the status of a request, if there is anything to say */
export function getStatusLabel(status: MediaStatus): string | undefined {
	const { request, preference, fulfilment, files, torrent, torrentItem } = status;

	if (isTorrentItemFailed(status)) return torrentItem?.error;
	switch (fulfilment?.status) {
		case 'downloading':
			// The rows say the file is wanted; how far it is, the engine says
			if (torrent?.status === 'starting' || torrentItem?.status === 'resolving') return 'Starting';
			return `Downloading ${Math.floor(progressOf(torrentItem) * 100)}%`;
		case 'pending':
			return 'Starting';
		case 'failed':
			return fulfilment.errorMessage;
	}

	// The rule of the series holds the request back until the user has watched up to it
	const inactive = request?.ahead ? 'Not needed yet' : undefined;

	// No request of anyone keeps a file from the next cleanup
	const cleanupAt = files.every((file) => file.cleanupAt) ? files[0]?.cleanupAt : undefined;
	if (cleanupAt) return `Deleted ${formatTimeUntil(cleanupAt)}`;
	// A file of another torrent, or one that was found on disk, plays as well
	if (files.length) return inactive ? `On disk · ${inactive}` : 'On disk';
	if (request && !request.approved) return 'Waiting for approval';
	if (request && !preference?.release && !preference?.mediaFileId) return 'No source selected';

	return inactive;
}

/** Whether the status is a failure, which the pages show in red */
export function isErrorStatus(status: MediaStatus): boolean {
	return isTorrentItemFailed(status) || status.fulfilment?.status === 'failed';
}
