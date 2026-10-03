import { MediaType } from '../common/common.dto.js';
import {
  DownloadsState,
  planDownloads,
  PlannedStatus,
} from './downloads.plan.js';

const SERIES = '100';
const PACK_HASH = '1'.repeat(40);
const EPISODE_HASH = '2'.repeat(40);

const file = (index: number, name: string, length = 100) => ({
  index,
  name,
  path: name,
  length,
});

const pack = {
  id: 'pack',
  infoHash: PACK_HASH,
  files: [
    file(0, 'Show.S01E01.mkv'),
    file(1, 'Show.S01E02E03.mkv'),
    file(2, 'Show.S01E01.sample.mkv', 1),
    file(3, 'info.nfo', 1),
  ],
  downloadedBytes: 0,
  uploadedBytes: 0,
};
const episodeTorrent = {
  id: 'episode',
  infoHash: EPISODE_HASH,
  files: [file(0, 'release-group.mkv'), file(1, 'readme.txt', 1)],
  downloadedBytes: 0,
  uploadedBytes: 0,
};

const request = (userId: string, episode: number, approved = true) => ({
  id: `${userId}-${episode}`,
  userId,
  tmdbId: SERIES,
  season: 1,
  episode,
  approved,
});

const selection = (userId: string, episode: number, torrentId: string) => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId: SERIES,
  season: 1,
  episode,
  torrentId,
});

const version = (infoHash: string, episode: number, lastEpisode = episode) => ({
  tmdbId: SERIES,
  season: 1,
  episode,
  lastEpisode,
  infoHash,
});

function plan(state: Partial<DownloadsState>) {
  const result = planDownloads({
    requests: [],
    selections: [],
    torrents: [pack, episodeTorrent],
    files: [],
    seedRatio: 0,
    ...state,
  });

  return {
    statuses: result.requests.map((r) => r.status),
    torrent: (id: string) => result.torrents.find((t) => t.torrentId === id),
  };
}

describe('planDownloads', () => {
  it('wants nothing from a torrent that is selected but not requested', () => {
    const { torrent } = plan({ selections: [selection('a', 0, 'pack')] });

    expect(torrent('pack')).toMatchObject({ wanted: [], selected: true });
    expect(torrent('episode').selected).toBe(false);
  });

  it('wants nothing for a request without a torrent or without approval', () => {
    const { statuses, torrent } = plan({
      requests: [request('a', 1), request('b', 1, false)],
      selections: [selection('b', 0, 'pack')],
    });

    expect(statuses).toEqual([
      PlannedStatus.NoSelection,
      PlannedStatus.WaitingForApproval,
    ]);
    expect(torrent('pack').wanted).toEqual([]);
  });

  it('wants the files of the requested episodes, the full file before a sample', () => {
    const { statuses, torrent } = plan({
      requests: [request('a', 1), request('a', 2), request('a', 3)],
      selections: [selection('a', 0, 'pack')],
    });

    expect(statuses).toEqual(Array(3).fill(PlannedStatus.Wanted));
    expect(torrent('pack').wanted).toEqual([
      { fileIndex: 0, tmdbId: SERIES, season: 1, episodes: [1] },
      { fileIndex: 1, tmdbId: SERIES, season: 1, episodes: [2, 3] },
    ]);
  });

  it('prefers the torrent selected for the episode over the season pack', () => {
    const { torrent } = plan({
      requests: [request('a', 1), request('a', 2)],
      selections: [selection('a', 0, 'pack'), selection('a', 2, 'episode')],
    });

    expect(torrent('pack').wanted.map((w) => w.fileIndex)).toEqual([0]);
    // The only video of an episode torrent is the episode, whatever its name
    expect(torrent('episode').wanted).toMatchObject([
      { fileIndex: 0, episodes: [2] },
    ]);
  });

  it('resolves every request with the selection of its own user', () => {
    const { statuses, torrent } = plan({
      requests: [request('a', 2), request('b', 2), request('c', 2)],
      selections: [selection('a', 0, 'pack'), selection('b', 2, 'episode')],
    });

    expect(statuses).toEqual([
      PlannedStatus.Wanted,
      PlannedStatus.Wanted,
      PlannedStatus.NoSelection,
    ]);
    expect(torrent('pack').wanted.map((w) => w.fileIndex)).toEqual([1]);
    expect(torrent('episode').wanted.map((w) => w.fileIndex)).toEqual([0]);
  });

  it('is fulfilled by the file of the selected torrent and by no other', () => {
    const { statuses, torrent } = plan({
      requests: [request('a', 2), request('a', 3), request('b', 2)],
      selections: [selection('a', 0, 'pack'), selection('b', 2, 'episode')],
      files: [version(PACK_HASH, 2, 3), version(undefined, 2)],
    });

    expect(statuses).toEqual([
      PlannedStatus.Available,
      PlannedStatus.Available,
      PlannedStatus.Wanted,
    ]);
    expect(torrent('pack').wanted).toEqual([]);
    expect(torrent('episode').wanted).toHaveLength(1);
  });

  it('waits for the file list of a torrent before wanting anything from it', () => {
    const { statuses, torrent } = plan({
      requests: [request('a', 1)],
      selections: [selection('a', 0, 'pack')],
      torrents: [{ ...pack, files: undefined }],
    });

    expect(statuses).toEqual([PlannedStatus.Resolving]);
    expect(torrent('pack')).toMatchObject({ wanted: [], needsFiles: true });
  });

  it('reports an episode that the torrent has no file for', () => {
    const { statuses } = plan({
      requests: [request('a', 9)],
      selections: [selection('a', 0, 'pack')],
    });

    expect(statuses).toEqual([PlannedStatus.NoFileInTorrent]);
  });

  it('seeds until the ratio is reached', () => {
    const seeding = (uploadedBytes: number) =>
      plan({
        torrents: [{ ...pack, downloadedBytes: 100, uploadedBytes }],
        seedRatio: 2,
      }).torrent('pack').seeds;

    expect(seeding(199)).toBe(true);
    expect(seeding(200)).toBe(false);
    expect(plan({ seedRatio: 2 }).torrent('pack').seeds).toBe(false);
  });
});
