import type { MovieRequestsDto, MovieStatusDto } from '$lib/apis/reiverr/reiverr.openapi';
import { getStatusTags, type MediaStatusTags } from '$lib/components/status-tags';
import type { TitleTorrents } from '$lib/queries/downloads.queries';
import { findDownload, heldFileOf, torrentItemOf } from '../request-status';

/** The three documents of a movie the request views read, each as far as it has loaded */
export type MovieData = {
	requests?: MovieRequestsDto;
	status?: MovieStatusDto;
	torrents?: TitleTorrents;
};

export type MovieRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one */
	infoHash?: string;
	/** The name of that torrent, or of the file selected for the movie */
	sourceName?: string;
	tags: MediaStatusTags;
};

export function getMovieRequestStatus({
	requests,
	status,
	torrents
}: MovieData): MovieRequestStatus {
	const selected = requests?.source;
	const fulfilment = status?.fulfilment;
	const files = status?.files ?? [];
	// A request that has its file keeps its torrent when another one is selected
	const infoHash = heldFileOf(fulfilment, files)?.infoHash ?? selected?.release?.infoHash;
	const torrent = infoHash ? torrents?.get(infoHash) : undefined;
	const release = selected?.release?.infoHash === infoHash ? selected?.release : undefined;
	const file = selected?.mediaFileId
		? files.find((file) => file.id === selected.mediaFileId)
		: undefined;
	// Without a request, the movie may download for someone else
	const download = requests?.request
		? { torrent, torrentItem: torrentItemOf(torrent, 0, 0) }
		: findDownload(torrents, 0, 0);

	return {
		requested: !!requests?.request,
		onDisk: files.length > 0,
		infoHash,
		sourceName: torrent?.title ?? release?.title ?? file?.fileName,
		tags: getStatusTags({
			request: requests?.request,
			source: selected,
			fulfilment,
			files,
			...download
		})
	};
}
