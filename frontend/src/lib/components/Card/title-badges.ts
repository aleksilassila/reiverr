import type { CatalogTitleDto } from '$lib/apis/reiverr/reiverr.openapi';
import { Trash, Video } from 'radix-icons-svelte';
import type { CardBadge } from './Card';

/**
 * The marks on the card of a title of a catalogue: the episodes on disk of a
 * series, in red the hours until the cleanup deletes every file of the title,
 * and the marks the page asks for, since a page that lists only titles on
 * disk has no use for them: that a movie is on disk, and, in place of the
 * count, the next episode of a series (S2E1), with the film icon when it is
 * on disk
 */
export function titleBadges(
	title: CatalogTitleDto,
	mark: { movieOnDisk?: boolean; nextEpisode?: boolean } = {}
): CardBadge[] {
	const onDisk =
		title.mediaType === 'series'
			? mark.nextEpisode && title.nextEpisode
				? {
						label: `S${title.nextEpisode.season}E${title.nextEpisode.episode}`,
						...(title.nextEpisode.onDisk && { icon: Video })
					}
				: title.available > 0 && { label: String(title.available), icon: Video }
			: mark.movieOnDisk && title.available > 0 && { icon: Video };

	return [
		...(onDisk ? [onDisk] : []),
		...(title.cleanupAt
			? [
					{
						label: `${Math.max(1, Math.ceil((Date.parse(title.cleanupAt) - Date.now()) / 3_600_000))}h`,
						icon: Trash,
						type: 'error' as const
					}
				]
			: [])
	];
}
