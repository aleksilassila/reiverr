import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import { TorrentFile } from './torrent-engine.js';

const files = (...entries: [string, number][]): TorrentFile[] =>
  entries.map(([filePath, length], index) => ({
    index,
    path: filePath,
    name: filePath.split('/').pop(),
    length,
  }));

describe('findEpisodeFile', () => {
  const pack = files(
    ['Show.S01/Show.S01E01.1080p.mkv', 1000],
    ['Show.S01/Show.S01E02E03.1080p.mkv', 2000],
    ['Show.S01/Sample/Show.S01E01.sample.mkv', 10],
    ['Show.S01/Show.S01E01.srt', 1],
    ['Show.S02/Show.S02E01.1080p.mkv', 1000],
  );

  it('finds the file of an episode by its numbers', () => {
    expect(findEpisodeFile(pack, 1, 1).index).toBe(0);
    expect(findEpisodeFile(pack, 2, 1).index).toBe(4);
  });

  it('finds a file that holds several episodes', () => {
    expect(findEpisodeFile(pack, 1, 2).index).toBe(1);
    expect(findEpisodeFile(pack, 1, 3).index).toBe(1);
  });

  it('finds nothing for an episode the torrent does not have', () => {
    expect(findEpisodeFile(pack, 1, 4)).toBeUndefined();
    expect(findEpisodeFile(pack, 3, 1)).toBeUndefined();
  });
});

describe('findOnlyVideoFile', () => {
  it('finds the video of a single episode torrent', () => {
    const torrent = files(
      ['release/group-release.mkv', 1000],
      ['release/sample.mkv', 10],
      ['release/info.nfo', 1],
    );

    expect(findOnlyVideoFile(torrent).index).toBe(0);
  });

  it('does not guess between several videos', () => {
    expect(
      findOnlyVideoFile(files(['a.mkv', 1000], ['b.mkv', 1000])),
    ).toBeUndefined();
  });
});
