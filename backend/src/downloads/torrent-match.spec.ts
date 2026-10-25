import * as path from 'node:path';
import { MediaType } from '../common/common.dto.js';
import { findItemFile, findSubtitleFiles } from './torrent-match.js';

const files = [
  {
    index: 0,
    name: 'Show.S01E01.mkv',
    path: 'Show.S01/Show.S01E01.mkv',
    length: 100,
  },
  {
    index: 1,
    name: 'Show.S01E02.mkv',
    path: 'Show.S01/Show.S01E02.mkv',
    length: 100,
  },
  {
    index: 2,
    name: 'Show.S01E02.sample.mkv',
    path: 'Show.S01/Sample/Show.S01E02.sample.mkv',
    length: 10,
  },
  { index: 3, name: 'info.nfo', path: 'Show.S01/info.nfo', length: 1 },
];

const item = (
  episode: number,
  options: { onlyVideo?: boolean; mediaType?: MediaType } = {},
) => ({
  mediaType: options.mediaType ?? MediaType.Series,
  season: 1,
  episode,
  onlyVideo: options.onlyVideo ?? false,
});

describe('findItemFile', () => {
  it('finds the video named after the episode, the full one before a sample', () => {
    expect(findItemFile(item(2), files)?.index).toBe(1);
    expect(findItemFile(item(3), files)).toBeUndefined();
  });

  it('takes the only video of a torrent picked for the episode itself, whatever its name', () => {
    const single = [
      {
        index: 0,
        name: 'release-group-1080p.mkv',
        path: 'release-group-1080p.mkv',
        length: 50,
      },
      { index: 1, name: 'sample.mkv', path: 'sample.mkv', length: 5 },
      { index: 2, name: 'readme.txt', path: 'readme.txt', length: 1 },
    ];

    expect(findItemFile(item(2), single)).toBeUndefined();
    expect(findItemFile(item(2, { onlyVideo: true }), single)?.index).toBe(0);
    // Two videos tell nothing
    expect(findItemFile(item(5, { onlyVideo: true }), files)).toBeUndefined();
  });

  it('takes the largest video for a movie', () => {
    expect(
      findItemFile(
        { mediaType: MediaType.Movie, season: 0, episode: 0, onlyVideo: false },
        files,
      )?.index,
    ).toBe(0);
  });
});

describe('findSubtitleFiles', () => {
  const file = (index: number, filePath: string, length = 10) => ({
    index,
    name: path.basename(filePath),
    path: filePath,
    length,
  });
  const indexesOf = (
    episode: number,
    video: ReturnType<typeof file>,
    all: ReturnType<typeof file>[],
  ) => findSubtitleFiles(item(episode), video, all).map((f) => f.index);

  it('finds the subtitles named after the video, in its folder, or after its episode', () => {
    const pack = [
      file(0, 'Show.S01/Show.S01E01.mkv', 100),
      file(1, 'Show.S01/Show.S01E02.mkv', 100),
      file(2, 'Show.S01/Show.S01E02.en.srt'),
      file(3, 'Show.S01/Show.S01E02.srt'),
      file(4, 'Show.S01/Subs/Show.S01E02/2_English.srt'),
      file(5, 'Show.S01/Subs/Show.S01E01/2_English.srt'),
      file(6, 'Show.S01/Subs/Show.S01E02.fi.srt'),
      file(7, 'Show.S01/Subs/English.srt'),
      file(8, 'Show.S01/Show.S01E02.idx'),
      file(9, 'Show.S01/Show.S01E02.nfo'),
    ];

    expect(indexesOf(2, pack[1], pack)).toEqual([2, 3, 4, 6]);
    expect(indexesOf(1, pack[0], pack)).toEqual([5]);
  });

  it('takes every subtitle of a torrent whose only video it is', () => {
    const single = [
      file(0, 'release-group-1080p.mkv', 50),
      file(1, 'sample.mkv', 5),
      file(2, 'Subs/English.srt'),
      file(3, 'Subs/2_French.vtt'),
      file(4, 'readme.txt'),
    ];

    expect(indexesOf(2, single[0], single)).toEqual([2, 3]);
  });
});
