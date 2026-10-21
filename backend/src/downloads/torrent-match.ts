import { MediaType } from '../common/common.dto.js';
import { isVideoFile, parseEpisodeNumbers } from '../library/library.utils.js';
import type { TorrentFileInfo } from './torrent-engine.js';
import type { TorrentItem } from './torrent-item.entity.js';

const isSample = (file: TorrentFileInfo) => /\bsample\b/i.test(file.name);

const largest = (files: TorrentFileInfo[]): TorrentFileInfo | undefined =>
  files.reduce<TorrentFileInfo | undefined>(
    (a, b) => (a && a.length >= b.length ? a : b),
    undefined,
  );

/**
 * The video file of an episode in a torrent, by the season and episode
 * numbers in the file names. Samples lose to the full file by size.
 */
export function findEpisodeFile(
  files: TorrentFileInfo[],
  season: number,
  episode: number,
): TorrentFileInfo | undefined {
  return largest(
    files.filter((file) => {
      if (!isVideoFile(file.name)) return false;

      const numbers = parseEpisodeNumbers(file.name);
      return numbers?.season === season && numbers.episodes.includes(episode);
    }),
  );
}

/** The video of a torrent that holds a single episode, whatever it is called */
export function findOnlyVideoFile(
  files: TorrentFileInfo[],
): TorrentFileInfo | undefined {
  const videos = files.filter(
    (file) => isVideoFile(file.name) && !isSample(file),
  );

  return videos.length === 1 ? videos[0] : undefined;
}

/** The video of a movie torrent: the largest one that is not a sample */
export function findMovieFile(
  files: TorrentFileInfo[],
): TorrentFileInfo | undefined {
  return largest(
    files.filter((file) => isVideoFile(file.name) && !isSample(file)),
  );
}

/** The file of a torrent that is an item, or nothing when the torrent has none for it */
export function findItemFile(
  item: Pick<TorrentItem, 'mediaType' | 'season' | 'episode' | 'onlyVideo'>,
  files: TorrentFileInfo[],
): TorrentFileInfo | undefined {
  if (item.mediaType === MediaType.Movie) return findMovieFile(files);

  return (
    findEpisodeFile(files, item.season, item.episode) ??
    (item.onlyVideo ? findOnlyVideoFile(files) : undefined)
  );
}
