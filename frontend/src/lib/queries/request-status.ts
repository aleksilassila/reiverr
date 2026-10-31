import type {
	EpisodeStatusDto,
	TorrentItemDto,
	TorrentWithItemsDto
} from '$lib/apis/reiverr/reiverr.openapi';

/** A torrent as the engine has it, without its items */
export type TorrentDto = Omit<TorrentWithItemsDto, 'items'>;

/** The status of the request of the user, as the status routes describe an episode or a movie */
export type RequestStatus = Pick<EpisodeStatusDto, 'status' | 'error' | 'onDisk' | 'cleanupAt'>;

/** The torrents of a title as the engine has them, by info hash */
export type TitleTorrents = Map<string, TorrentWithItemsDto>;

/** The torrent a request downloads from as the engine has it, with its item for the episode or the movie */
export type LiveDownload = { torrent?: TorrentDto; item?: TorrentItemDto };

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

/** The item of a torrent for an episode, or for a movie with season and episode 0 */
export function itemOf(
	torrent: TorrentWithItemsDto | undefined,
	season: number,
	episode: number
): TorrentItemDto | undefined {
	return torrent?.items.find((item) => item.season === season && item.episode === episode);
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

const progressOf = (item?: TorrentItemDto) =>
	item?.status === 'complete' ? 1 : (item?.progress ?? 0);

/** The line the pages show of the status of a request, if there is anything to say */
export function getStatusLabel(
	status?: RequestStatus,
	live: LiveDownload = {}
): string | undefined {
	switch (status?.status) {
		case 'downloading':
			// The rows say the file is wanted; how far it is, the engine says
			if (live.torrent?.status === 'starting' || live.item?.status === 'resolving') {
				return 'Starting';
			}
			return `Downloading ${Math.floor(progressOf(live.item) * 100)}%`;
		case 'resolving':
			return 'Starting';
		case 'over-quota':
			return 'Over quota';
		case 'disk-full':
			return 'Disk full';
		case 'failed':
		case 'no-file-in-torrent':
			return status.error;
	}

	// The rule of the series holds the request back until the user has watched up to it
	const inactive = status?.status === 'inactive-ahead' ? 'Not needed yet' : undefined;

	// No request of anyone keeps a file from the next cleanup
	if (status?.onDisk && status.cleanupAt) {
		return `Deleted ${formatTimeUntil(status.cleanupAt)}`;
	}
	// A file of another torrent, or one that was found on disk, plays as well
	if (status?.onDisk) return inactive ? `On disk · ${inactive}` : 'On disk';
	if (status?.status === 'waiting-for-approval') return 'Waiting for approval';
	if (status?.status === 'no-preference') return 'No source selected';

	return inactive;
}

/** Whether the status is a failure, which the pages show in red */
export function isErrorStatus(status?: RequestStatus): boolean {
	return (
		status?.status === 'failed' ||
		status?.status === 'no-file-in-torrent' ||
		status?.status === 'over-quota' ||
		status?.status === 'disk-full'
	);
}
