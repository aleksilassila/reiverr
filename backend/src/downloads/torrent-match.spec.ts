import { MediaType } from '../common/common.dto.js';
import { findItemFile } from './torrent-match.js';

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
