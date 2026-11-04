import * as path from 'node:path';
import { MediaType } from '../common/common.dto.js';
import {
  isSubtitleFile,
  isVideoFile,
  parseEpisodeNumbers,
} from '../library/library.utils.js';
import type { TorrentFileInfo } from './torrent-engine.js';
import type { TorrentItem } from './torrent-item.entity.js';

const isSample = (file: TorrentFileInfo) => /\bsample\b/i.test(file.name);

const baseName = (fileName: string) =>
  path.basename(fileName, path.extname(fileName));

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

/** The file of a torrent that a torrent item is, or nothing when the torrent has none for it */
export function findTorrentItemFile(
  torrentItem: Pick<
    TorrentItem,
    'mediaType' | 'season' | 'episode' | 'onlyVideo'
  >,
  files: TorrentFileInfo[],
): TorrentFileInfo | undefined {
  if (torrentItem.mediaType === MediaType.Movie) return findMovieFile(files);

  return (
    findEpisodeFile(files, torrentItem.season, torrentItem.episode) ??
    (torrentItem.onlyVideo ? findOnlyVideoFile(files) : undefined)
  );
}

/**
 * The subtitle files of a torrent that belong to the video of a torrent item,
 * as torrents place them: named after the video ("<video>.en.srt"), in a folder
 * named after it ("Subs/<video>/2_English.srt"), named after the same episode,
 * or anywhere in a torrent whose only video it is.
 */
export function findSubtitleFiles(
  torrentItem: Pick<TorrentItem, 'mediaType' | 'season' | 'episode'>,
  video: TorrentFileInfo,
  files: TorrentFileInfo[],
): TorrentFileInfo[] {
  const videoBase = baseName(video.name);
  const isOnlyVideo = findOnlyVideoFile(files)?.index === video.index;

  return files.filter((file) => {
    if (!isSubtitleFile(file.name)) return false;
    if (isOnlyVideo) return true;

    const base = baseName(file.name);
    if (base === videoBase || base.startsWith(`${videoBase}.`)) return true;
    if (path.basename(path.dirname(file.path)) === videoBase) return true;
    if (torrentItem.mediaType !== MediaType.Series) return false;

    const numbers = parseEpisodeNumbers(file.name);
    return (
      numbers?.season === torrentItem.season &&
      numbers.episodes.includes(torrentItem.episode)
    );
  });
}
