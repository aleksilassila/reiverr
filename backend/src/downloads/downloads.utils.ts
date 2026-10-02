import {
  isVideoFile,
  parseEpisodeNumbers,
} from '../local-media/local-media.utils.js';
import { TorrentFile } from './torrent-engine.js';

const largest = (files: TorrentFile[]): TorrentFile | undefined =>
  files.reduce<TorrentFile | undefined>(
    (a, b) => (a && a.length >= b.length ? a : b),
    undefined,
  );

/**
 * The video file of an episode in a torrent, by the season and episode
 * numbers in the file names. Samples lose to the full file by size.
 */
export function findEpisodeFile(
  files: TorrentFile[],
  season: number,
  episode: number,
): TorrentFile | undefined {
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
  files: TorrentFile[],
): TorrentFile | undefined {
  const videos = files.filter(
    (file) => isVideoFile(file.name) && !/\bsample\b/i.test(file.name),
  );

  return videos.length === 1 ? videos[0] : undefined;
}
