import { Activity } from '../requests/request-activity.js';
import { heldFiles, Holdings, requestsOfFiles } from './retention.js';

const PACK = '1'.repeat(40);
const EPISODE = '2'.repeat(40);

const request = (
  id: string,
  episode: number,
  torrentId?: string,
  mediaFileId?: string,
) => ({ id, tmdbId: '100', season: 1, episode, torrentId, mediaFileId });

const version = (infoHash: string, episode: number, lastEpisode = episode) => ({
  id: `${infoHash.slice(0, 1)}/${episode}`,
  infoHash,
  tmdbId: '100',
  season: 1,
  episode,
  lastEpisode,
});

const holdings = (
  requests: ReturnType<typeof request>[],
  activity: Record<string, Activity>,
): Holdings<ReturnType<typeof version>> => ({
  requests,
  activity: new Map(Object.entries(activity)),
  infoHashes: new Map([
    ['pack', PACK],
    ['episode', EPISODE],
  ]),
  files: [version(PACK, 1), version(PACK, 2, 3), version(EPISODE, 2)],
});

describe('heldFiles', () => {
  it('holds the file of an active or kept request, stored or of its torrent', () => {
    const held = heldFiles(
      holdings(
        [
          request('stored', 1, 'pack', '2/2'),
          request('derived', 3, 'pack'),
          request('kept', 1, 'pack'),
        ],
        { stored: 'active', derived: 'active', kept: 'kept' },
      ),
    );

    expect([...held].sort()).toEqual(['1/1', '1/2', '2/2'].sort());
  });

  it('holds nothing for a request that waits or that a rule holds back', () => {
    const held = heldFiles(
      holdings(
        [
          request('waiting', 1, 'pack'),
          request('ahead', 2, 'pack', '1/2'),
          request('watched', 2, 'episode', '2/2'),
        ],
        { waiting: 'waiting', ahead: 'ahead', watched: 'watched' },
      ),
    );

    expect(held.size).toBe(0);
  });
});

describe('requestsOfFiles', () => {
  it('finds the requests that refer to a file and the holding ones that would', () => {
    const found = requestsOfFiles(
      holdings(
        [
          request('stored', 2, 'episode', '2/2'),
          request('inactive', 2, 'episode', '2/2'),
          request('derived', 3, 'pack'),
          request('waiting', 2, 'pack'),
          request('other', 1, 'pack'),
        ],
        {
          stored: 'active',
          inactive: 'ahead',
          derived: 'active',
          waiting: 'waiting',
          other: 'active',
        },
      ),
      new Set(['2/2', '1/2']),
    );

    expect(Object.fromEntries(found)).toEqual({
      stored: { torrentId: 'episode', fileId: '2/2' },
      inactive: { torrentId: 'episode', fileId: '2/2' },
      derived: { torrentId: 'pack', fileId: '1/2' },
    });
  });
});
