import type { EpisodeStatusDto } from '$lib/apis/reiverr/reiverr.openapi';

/** Where the request of the user stands, as the status routes describe an episode or a movie */
export type RequestStatus = Pick<
	EpisodeStatusDto,
	'status' | 'progress' | 'error' | 'onDisk' | 'cleanupAt'
>;

function formatTimeUntil(date: string): string {
	const hours = Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 3_600_000));
	const days = Math.round(hours / 24);

	if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
	return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}

/** The line the pages show of where a request stands, if there is anything to say */
export function getStatusLabel(status?: RequestStatus): string | undefined {
	switch (status?.status) {
		case 'downloading':
			return `Downloading ${Math.floor((status.progress ?? 0) * 100)}%`;
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
