import type {
	FulfilmentStatusDto,
	MediaFileDto,
	MediaRequestDto,
	RequestSourceDto,
	TorrentItemDto,
	TorrentWithItemsDto
} from '$lib/apis/reiverr/reiverr.openapi';
import {
	Check,
	Clock,
	Download,
	Enter,
	ExclamationTriangle,
	File,
	Pause,
	QuestionMarkCircled,
	Trash,
	Update
} from 'radix-icons-svelte';
import type { ComponentType } from 'svelte';

/** A torrent as the engine has it, without its torrent items */
export type TorrentDto = Omit<TorrentWithItemsDto, 'torrentItems'>;

/** The torrents of a title as the engine has them, by info hash */
export type TitleTorrents = Map<string, TorrentWithItemsDto>;

/** What the tags of an episode or a movie are made from */
type StatusTagsInput = {
	request?: MediaRequestDto;
	/** The source of the request: the release or the file the user picked for it */
	source?: RequestSourceDto;
	fulfilment?: FulfilmentStatusDto;
	/** The files of the episode or the movie */
	files: MediaFileDto[];
	/** The torrent the request downloads from, or without a request the one that downloads for someone else */
	torrent?: TorrentDto;
	/** The torrent item of the episode or the movie in it */
	torrentItem?: TorrentItemDto;
};

/** A tag of the status of an episode or a movie */
export type StatusTag = {
	/** What it says at full size */
	label: string;
	/** What it says next to its icon when collapsed: without it, the icon alone */
	shortLabel?: string;
	/** The failure as the server words it, for where there is room */
	detail?: string;
	icon: ComponentType;
	type: 'default' | 'secondary' | 'progress' | 'error';
};

/**
 * The tags of an episode or a movie. The primary one is of its request: the
 * download, what failed, or how the request stands. The secondary one is of
 * its files, and collapses next to a primary one.
 */
export type MediaStatusTags = {
	primary?: StatusTag;
	secondary?: StatusTag;
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

/** The torrent items that are on their way to the library */
const isDownloading = (torrentItem: TorrentItemDto) =>
	torrentItem.status === 'resolving' ||
	torrentItem.status === 'downloading' ||
	torrentItem.status === 'complete';

const progressOf = (torrentItem: TorrentItemDto) =>
	torrentItem.status === 'complete' ? 1 : (torrentItem.progress ?? 0);

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

function formatTimeUntil(date: string): string {
	const hours = Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 3_600_000));

	return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

const FULFILMENT_ERRORS: Record<NonNullable<FulfilmentStatusDto['error']>, string> = {
	'import-failed': 'Import failed',
	'file-not-in-library': 'File missing',
	'file-not-of-media': 'Wrong file',
	'over-quota': 'Over quota',
	'disk-full': 'Disk full'
};

/** How far the download of a torrent item is, or what keeps the torrent from giving its file */
function getDownloadTag(torrent?: TorrentDto, torrentItem?: TorrentItemDto): StatusTag {
	switch (torrentItem?.status) {
		case 'failed':
			return {
				label: 'Download failed',
				detail: torrentItem.error,
				icon: ExclamationTriangle,
				type: 'error'
			};
		case 'no-match':
			return {
				label: 'Not in torrent',
				detail: torrentItem.error,
				icon: ExclamationTriangle,
				type: 'error'
			};
		case 'complete':
			return { label: 'Importing', icon: Enter, type: 'progress' };
		case 'downloading': {
			const percent = `${Math.floor(progressOf(torrentItem) * 100)}%`;

			return torrent?.peers === 0
				? { label: `Stalled ${percent}`, shortLabel: percent, icon: Pause, type: 'progress' }
				: {
						label: `Downloading ${percent}`,
						shortLabel: percent,
						icon: Download,
						type: 'progress'
					};
		}
		default:
			// The rows say the file is wanted, and the engine has yet to say how far it is
			return { label: 'Starting', icon: Update, type: 'progress' };
	}
}

/** The download, then what failed, then how the request stands */
function getPrimaryTag({
	request,
	source,
	fulfilment,
	torrent,
	torrentItem
}: StatusTagsInput): StatusTag | undefined {
	// What downloads for someone else ends up on disk for everyone
	if (!request) return torrentItem && getDownloadTag(torrent, torrentItem);

	switch (fulfilment?.status) {
		case 'downloading':
			return getDownloadTag(torrent, torrentItem);
		case 'pending':
			return { label: 'Starting', icon: Update, type: 'progress' };
		case 'failed':
			return {
				label: fulfilment.error ? FULFILMENT_ERRORS[fulfilment.error] : 'Failed',
				detail: fulfilment.errorMessage,
				icon: ExclamationTriangle,
				type: 'error'
			};
		case 'fulfilled':
			return { label: 'Fulfilled', icon: Check, type: 'default' };
	}

	if (!request.approved) return { label: 'Waiting for approval', icon: Clock, type: 'default' };
	if (!source?.release && !source?.mediaFileId) {
		return { label: 'No source', icon: QuestionMarkCircled, type: 'default' };
	}
	// The rule of the series holds the request back until the user has watched up to it
	return request.ahead ? { label: 'Not needed', icon: Clock, type: 'secondary' } : undefined;
}

/** What is on disk for a request that does not have its file: a file that stays, else when the cleanup deletes the last ones */
function getSecondaryTag({ fulfilment, files }: StatusTagsInput): StatusTag | undefined {
	if (fulfilment?.status === 'fulfilled' || !files.length) return undefined;

	// No request of anyone keeps a file from the next cleanup
	const cleanupAt = files.every((file) => file.cleanupAt) ? files[0]?.cleanupAt : undefined;
	// A file stays: it was found on disk, or a request of anyone holds it
	if (!cleanupAt) return { label: 'On disk', icon: File, type: 'secondary' };

	const until = formatTimeUntil(cleanupAt);

	return { label: `Deleted in ${until}`, shortLabel: until, icon: Trash, type: 'error' };
}

export function getStatusTags(input: StatusTagsInput): MediaStatusTags {
	return { primary: getPrimaryTag(input), secondary: getSecondaryTag(input) };
}
