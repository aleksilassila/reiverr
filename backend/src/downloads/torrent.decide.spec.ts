import { MediaType } from '../common/common.dto.js';
import { findItemFile } from './torrent-match.js';
import { decideTorrent, TorrentState } from './torrent.decide.js';

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

describe('decideTorrent', () => {
  const state = (overrides: Partial<TorrentState>): TorrentState => ({
    wanted: [],
    hasFiles: true,
    torrent: { downloadedBytes: 0, uploadedBytes: 0, error: undefined },
    runtime: undefined,
    hasData: false,
    seedRatio: 0,
    ...overrides,
  });
  const running = (complete: number[] = []) => ({
    ready: true,
    complete: new Set(complete),
  });

  it('releases a torrent that nothing wants and that does not seed', () => {
    expect(decideTorrent(state({}))).toEqual({ kind: 'release' });
    expect(
      decideTorrent(
        state({ wanted: [{ fileIndex: 0, completedAt: new Date() }] }),
      ),
    ).toEqual({ kind: 'stop' });
  });

  it('starts a torrent for an item that waits for its file, or for the file list', () => {
    expect(
      decideTorrent(
        state({ wanted: [{ fileIndex: 0, completedAt: undefined }] }),
      ),
    ).toEqual({ kind: 'start' });
    expect(
      decideTorrent(
        state({
          hasFiles: false,
          wanted: [{ fileIndex: undefined, completedAt: undefined }],
        }),
      ),
    ).toEqual({ kind: 'start' });
    // An item without a file in a known list downloads nothing
    expect(
      decideTorrent(
        state({ wanted: [{ fileIndex: undefined, completedAt: undefined }] }),
      ),
    ).toEqual({ kind: 'stop' });
  });

  it('waits for the engine, then downloads the files of the wanted items', () => {
    const wanted = [
      { fileIndex: 0, completedAt: undefined },
      { fileIndex: 1, completedAt: undefined },
      { fileIndex: 1, completedAt: undefined },
    ];

    expect(
      decideTorrent(
        state({ wanted, runtime: { ready: false, complete: new Set() } }),
      ),
    ).toEqual({ kind: 'wait' });
    expect(decideTorrent(state({ wanted, runtime: running([1]) }))).toEqual({
      kind: 'run',
      wanted: [0, 1],
      complete: [1],
    });
  });

  it('keeps a torrent running while it seeds, up to the ratio', () => {
    const seeding = (uploadedBytes: number, seedRatio: number) =>
      decideTorrent(
        state({
          torrent: { downloadedBytes: 100, uploadedBytes, error: undefined },
          hasData: true,
          runtime: running(),
          seedRatio,
        }),
      );

    expect(seeding(50, 2)).toEqual({ kind: 'run', wanted: [], complete: [] });
    expect(seeding(200, 2)).toEqual({ kind: 'release' });
    expect(seeding(0, 0)).toEqual({ kind: 'release' });
    // A torrent that seeds is started again after a restart
    expect(
      decideTorrent(
        state({
          torrent: { downloadedBytes: 100, uploadedBytes: 0, error: undefined },
          hasData: true,
          seedRatio: 1,
        }),
      ),
    ).toEqual({ kind: 'start' });
  });

  it('fails a torrent the engine failed, and leaves a failed one stopped', () => {
    const wanted = [{ fileIndex: 0, completedAt: undefined }];

    expect(
      decideTorrent(
        state({
          wanted,
          runtime: { ready: true, error: 'no peers', complete: new Set() },
        }),
      ),
    ).toEqual({ kind: 'fail', error: 'no peers' });
    expect(
      decideTorrent(
        state({
          wanted,
          torrent: { downloadedBytes: 0, uploadedBytes: 0, error: 'no peers' },
        }),
      ),
    ).toEqual({ kind: 'failed' });
    // A failed torrent does not seed: its data goes when nothing wants it
    expect(
      decideTorrent(
        state({
          torrent: {
            downloadedBytes: 100,
            uploadedBytes: 0,
            error: 'no peers',
          },
          hasData: true,
          seedRatio: 1,
        }),
      ),
    ).toEqual({ kind: 'release' });
  });
});
