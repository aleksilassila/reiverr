import { MediaType } from '../common/common.dto.js';
import {
  DownloadsState,
  planDownloads,
  PlannedStatus,
} from './downloads.plan.js';

const SERIES = '100';
const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 10);
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

/** A request that was planned before, with what it refers to since */
const bound = (
  userId: string,
  episode: number,
  torrentId: string,
  file?: { id: string },
) => ({ ...request(userId, episode), torrentId, mediaFileId: file?.id });

const selection = (userId: string, episode: number, torrentId: string) => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId: SERIES,
  season: 1,
  episode,
  torrentId,
});

// A file without an info hash was found on disk and is not managed
const version = (infoHash: string, episode: number, lastEpisode = episode) => ({
  id: `${infoHash}/${episode}`,
  tmdbId: SERIES,
  season: 1,
  episode,
  lastEpisode,
  infoHash,
  managed: !!infoHash,
});

const rule = (
  userId: string,
  limits: Partial<DownloadsState['rules'][number]>,
) => ({
  userId,
  tmdbId: SERIES,
  keepNext: null,
  keepWatched: null,
  keepWatchedHours: null,
  ...limits,
});

const started = (userId: string, episode: number) => ({
  userId,
  tmdbId: SERIES,
  season: 1,
  episode,
  watched: false,
  progress: 0.1,
  watchedAt: undefined,
});

const watched = (userId: string, episode: number, hoursAgo = 0) => ({
  ...started(userId, episode),
  watched: true,
  watchedAt: new Date(NOW - hoursAgo * HOUR),
});

function plan(state: Partial<DownloadsState>) {
  const result = planDownloads({
    requests: [],
    selections: [],
    torrents: [pack, episodeTorrent],
    files: [],
    rules: [],
    playStates: [],
    now: NOW,
    seedRatio: 0,
    ...state,
  });

  return {
    statuses: result.requests.map((r) => r.status),
    references: result.requests.map((r) => [r.torrentId, r.mediaFileId]),
    torrent: (id: string) => result.torrents.find((t) => t.torrentId === id),
    unretained: result.unretained,
  };
}

describe('planDownloads', () => {
  it('wants nothing from a torrent that is selected but not requested', () => {
    const { torrent } = plan({ selections: [selection('a', 0, 'pack')] });

    expect(torrent('pack')).toMatchObject({ wanted: [], referenced: true });
    expect(torrent('episode').referenced).toBe(false);
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

  it('takes the only video for the episode only of a torrent that is selected for it', () => {
    const { statuses } = plan({
      requests: [request('a', 2)],
      selections: [selection('a', 0, 'episode')],
    });

    expect(statuses).toEqual([PlannedStatus.NoFileInTorrent]);
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

  it('is not fulfilled by the file of another season or another series', () => {
    const { statuses } = plan({
      requests: [
        request('a', 1),
        { ...request('a', 1), season: 2 },
        { ...request('a', 1), tmdbId: '200' },
      ],
      selections: [
        selection('a', 0, 'pack'),
        { ...selection('a', 0, 'pack'), season: 2 },
        { ...selection('a', 0, 'pack'), tmdbId: '200' },
      ],
      files: [version(PACK_HASH, 1)],
    });

    expect(statuses).toEqual([
      PlannedStatus.Available,
      PlannedStatus.NoFileInTorrent,
      PlannedStatus.Wanted,
    ]);
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

  describe('references', () => {
    const packE1 = version(PACK_HASH, 1);
    const episodeE2 = version(EPISODE_HASH, 2);

    it('binds a request to the torrent its user prefers and to the file of that torrent', () => {
      const { references, torrent } = plan({
        requests: [request('a', 1), request('a', 2), request('b', 1)],
        selections: [selection('a', 0, 'pack')],
        files: [packE1],
      });

      expect(references).toEqual([
        ['pack', packE1.id],
        ['pack', undefined],
        [undefined, undefined],
      ]);
      expect(torrent('pack').referenced).toBe(true);
    });

    it('keeps the torrent and the file of a request when its user selects another torrent', () => {
      const requests = [bound('a', 2, 'episode', episodeE2)];
      const files = [episodeE2, version(PACK_HASH, 2, 3)];

      for (const selections of [[selection('a', 0, 'pack')], []]) {
        const { statuses, references, torrent, unretained } = plan({
          requests,
          selections,
          files,
        });

        expect(statuses).toEqual([PlannedStatus.Available]);
        expect(references).toEqual([['episode', episodeE2.id]]);
        expect(torrent('episode').referenced).toBe(true);
        expect(unretained).toEqual([files[1]]);
      }
    });

    it('downloads the file of a request again from its torrent', () => {
      // The file of the request is gone, and with it the reference
      const { statuses, references, torrent } = plan({
        requests: [bound('a', 1, 'pack')],
        selections: [selection('a', 0, 'episode')],
      });

      expect(statuses).toEqual([PlannedStatus.Wanted]);
      expect(references).toEqual([['pack', undefined]]);
      expect(torrent('pack').wanted.map((w) => w.fileIndex)).toEqual([0]);
    });

    it('binds no request that waits for approval or that a rule holds back', () => {
      const { statuses, references } = plan({
        requests: [request('a', 1, false), request('b', 1), request('b', 2)],
        selections: [selection('a', 0, 'pack'), selection('b', 0, 'pack')],
        files: [packE1],
        rules: [rule('b', { keepNext: 1 })],
      });

      expect(statuses).toEqual([
        PlannedStatus.WaitingForApproval,
        PlannedStatus.Available,
        PlannedStatus.InactiveAhead,
      ]);
      expect(references).toEqual([
        [undefined, undefined],
        ['pack', packE1.id],
        [undefined, undefined],
      ]);
    });

    it('leaves the references of an inactive request, which holds nothing', () => {
      const { statuses, references, unretained } = plan({
        requests: [bound('a', 1, 'pack', packE1), request('a', 2)],
        files: [packE1],
        rules: [rule('a', { keepWatchedHours: 1 })],
        playStates: [watched('a', 1, 2)],
      });

      expect(statuses).toEqual([
        PlannedStatus.InactiveWatched,
        PlannedStatus.NoSelection,
      ]);
      expect(references[0]).toEqual(['pack', packE1.id]);
      expect(unretained).toEqual([packE1]);
    });

    it('binds a request that a rule keeps only together with its file', () => {
      const state = {
        requests: [request('a', 1), request('a', 2)],
        selections: [selection('a', 0, 'pack')],
        rules: [rule('a', { keepWatched: 1 })],
        playStates: [watched('a', 1)],
      };

      expect(plan(state).references[0]).toEqual([undefined, undefined]);
      expect(plan({ ...state, files: [packE1] }).references[0]).toEqual([
        'pack',
        packE1.id,
      ]);
    });
  });

  describe('with a rule', () => {
    const requests = [
      request('a', 1),
      request('a', 2),
      request('a', 3),
      { ...request('a', 1), season: 2 },
    ];
    const active = PlannedStatus.NoSelection;
    const ahead = PlannedStatus.InactiveAhead;
    const dropped = PlannedStatus.InactiveWatched;

    it('holds back the requests beyond the next ones after the last watched episode', () => {
      const statuses = (playStates: DownloadsState['playStates']) =>
        plan({ requests, rules: [rule('a', { keepNext: 2 })], playStates })
          .statuses;

      expect(statuses([])).toEqual([active, active, ahead, ahead]);
      // An episode in progress is not watched yet: it is one of the next
      expect(statuses([started('a', 1)])).toEqual([
        active,
        active,
        ahead,
        ahead,
      ]);
      expect(statuses([watched('a', 1)])).toEqual([
        active,
        active,
        active,
        ahead,
      ]);
      expect(statuses([watched('a', 2)])).toEqual(Array(4).fill(active));
    });

    it('keeps the requests for skipped episodes', () => {
      const { statuses } = plan({
        requests,
        rules: [rule('a', { keepNext: 1 })],
        playStates: [watched('a', 2)],
      });

      expect(statuses).toEqual([active, active, active, ahead]);
    });

    it('applies to the approved requests of its user for its series', () => {
      const { statuses } = plan({
        requests: [
          request('a', 1, false),
          request('a', 2),
          request('a', 3),
          request('b', 3),
          { ...request('a', 3), tmdbId: '200' },
        ],
        rules: [rule('a', { keepNext: 1 })],
        playStates: [watched('b', 1), { ...watched('a', 3), tmdbId: '200' }],
      });

      expect(statuses).toEqual([
        PlannedStatus.WaitingForApproval,
        active,
        ahead,
        active,
        active,
      ]);
    });

    // Season 1 downloads from the pack and all of it is in the library
    const inLibrary = {
      selections: [selection('a', 0, 'pack')],
      files: [version(PACK_HASH, 1), version(PACK_HASH, 2, 3)],
    };
    const available = PlannedStatus.Available;

    it('drops the watched requests that are not among the last ones', () => {
      const { statuses } = plan({
        requests,
        ...inLibrary,
        rules: [rule('a', { keepWatched: 1 })],
        playStates: [watched('a', 1), watched('a', 2), watched('a', 3)],
      });

      expect(statuses).toEqual([dropped, dropped, available, active]);
    });

    it('drops the watched requests that were not watched lately', () => {
      const statuses = (keepWatchedHours: number) =>
        plan({
          requests,
          ...inLibrary,
          rules: [rule('a', { keepWatchedHours })],
          playStates: [watched('a', 1, 30), watched('a', 3, 20)],
        }).statuses;

      expect(statuses(24)).toEqual([dropped, available, available, active]);
      expect(statuses(20)).toEqual([dropped, available, dropped, active]);
    });

    it('drops with both limits only what neither of them keeps', () => {
      const { statuses } = plan({
        requests,
        ...inLibrary,
        rules: [rule('a', { keepWatched: 1, keepWatchedHours: 24 })],
        playStates: [
          watched('a', 1, 30),
          watched('a', 2, 20),
          watched('a', 3, 25),
        ],
      });

      expect(statuses).toEqual([dropped, available, available, active]);
    });

    it('keeps none of the last watched requests when nothing is left to watch', () => {
      const statuses = (
        playStates: DownloadsState['playStates'],
        limits: Partial<DownloadsState['rules'][number]> = { keepWatched: 1 },
      ) =>
        plan({
          requests: requests.slice(0, 3),
          ...inLibrary,
          rules: [rule('a', limits)],
          playStates,
        }).statuses;

      // An episode in progress is not watched yet
      expect(
        statuses([watched('a', 1), watched('a', 2), started('a', 3)]),
      ).toEqual([dropped, available, available]);
      expect(
        statuses([watched('a', 1), watched('a', 2), watched('a', 3)]),
      ).toEqual([dropped, dropped, dropped]);
      // A skipped episode is not something left to watch, and stays active
      expect(statuses([watched('a', 2), watched('a', 3)])).toEqual([
        available,
        dropped,
        dropped,
      ]);
      // The time limit goes on keeping what was watched lately
      expect(
        statuses([watched('a', 1, 30), watched('a', 2, 30), watched('a', 3)], {
          keepWatched: 1,
          keepWatchedHours: 24,
        }),
      ).toEqual([dropped, dropped, available]);
    });

    it('holds on to the file of a kept request and downloads none for it', () => {
      const state = {
        requests,
        rules: [rule('a', { keepWatched: 2 })],
        playStates: [watched('a', 1), watched('a', 2)],
      };
      const { statuses, torrent } = plan({
        ...state,
        selections: [selection('a', 0, 'pack')],
        files: [version(PACK_HASH, 1)],
      });

      expect(statuses).toEqual([
        available,
        dropped,
        PlannedStatus.Wanted,
        active,
      ]);
      // Episodes 2 and 3 are one file, wanted for the unwatched episode 3 alone
      expect(torrent('pack').wanted).toEqual([
        { fileIndex: 1, tmdbId: SERIES, season: 1, episodes: [3] },
      ]);

      // Without a torrent there is no file to keep either
      expect(plan(state).statuses).toEqual([dropped, dropped, active, active]);
    });

    it('downloads for a watched request while no limit on watched requests is set', () => {
      const { statuses } = plan({
        requests,
        selections: [selection('a', 0, 'pack')],
        rules: [rule('a', { keepNext: 3 })],
        playStates: [watched('a', 1)],
      });

      expect(statuses).toEqual([
        ...Array(3).fill(PlannedStatus.Wanted),
        active,
      ]);
    });

    it('wants nothing for an inactive request', () => {
      const { statuses, torrent } = plan({
        requests,
        selections: [selection('a', 0, 'pack')],
        rules: [rule('a', { keepNext: 1, keepWatchedHours: 1 })],
        playStates: [watched('a', 1, 2)],
      });

      expect(statuses).toEqual([dropped, PlannedStatus.Wanted, ahead, ahead]);
      // Episodes 2 and 3 are one file, wanted for the active episode 2 alone
      expect(torrent('pack').wanted).toEqual([
        { fileIndex: 1, tmdbId: SERIES, season: 1, episodes: [2] },
      ]);
    });
  });

  describe('unretained files', () => {
    const packE1 = version(PACK_HASH, 1);
    const packE2E3 = version(PACK_HASH, 2, 3);
    const episodeE2 = version(EPISODE_HASH, 2);
    const found = version(undefined, 1);
    const files = [packE1, packE2E3, episodeE2, found];
    const unretained = (state: Partial<DownloadsState>) =>
      plan({ files, ...state }).unretained;

    it('are the managed files that no request holds', () => {
      expect(unretained({})).toEqual([packE1, packE2E3, episodeE2]);

      expect(
        unretained({
          requests: [request('a', 3)],
          selections: [selection('a', 0, 'pack')],
        }),
      ).toEqual([packE1, episodeE2]);

      // The request of one user is enough
      expect(
        unretained({
          requests: [request('a', 3), request('b', 1), request('b', 2)],
          selections: [
            selection('a', 0, 'pack'),
            selection('b', 0, 'pack'),
            selection('b', 2, 'episode'),
          ],
        }),
      ).toEqual([]);
    });

    it('are not held by a request that their file does not fulfil', () => {
      const selections = [selection('a', 0, 'pack')];

      // Without approval, and without a torrent
      expect(
        unretained({
          requests: [request('a', 1, false), request('b', 2)],
          selections,
        }),
      ).toEqual([packE1, packE2E3, episodeE2]);

      // With another torrent selected for the episode
      expect(
        unretained({
          requests: [request('a', 2)],
          selections: [...selections, selection('a', 2, 'episode')],
        }),
      ).toEqual([packE1, packE2E3]);

      // Made inactive by a rule
      expect(
        unretained({
          requests: [request('a', 1), request('a', 3)],
          selections,
          rules: [rule('a', { keepNext: 1 })],
        }),
      ).toEqual([packE2E3, episodeE2]);
      expect(
        unretained({
          requests: [request('a', 1), request('a', 3)],
          selections,
          rules: [rule('a', { keepWatchedHours: 1 })],
          playStates: [watched('a', 1, 2)],
        }),
      ).toEqual([packE1, episodeE2]);
    });
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
