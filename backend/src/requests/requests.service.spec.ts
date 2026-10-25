import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { IndexersService, Release } from '../indexers/indexers.service.js';
import { Job, JobStatus } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { User } from '../users/user.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService, SelectionTarget } from './requests.service.js';
import { SelectedRelease } from './selected-release.entity.js';

const SERIES = '100';
const PACK = '1'.repeat(40);
const EPISODE = '2'.repeat(40);
const HOUR = 60 * 60 * 1000;

describe('RequestsService', () => {
  let orm: MikroORM;
  let requests: RequestsService;
  let userId: string;

  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const release = (id: string, infoHash: string): Release => ({
    id,
    guid: id,
    indexer: 'test',
    title: id,
    size: 1,
    seeders: 1,
    peers: 1,
    infoHash,
    magnetUrl: `magnet:?xt=urn:btih:${infoHash}`,
    seasons: [1],
    episodes: [],
  });
  const releases = new Map([
    ['pack', release('pack', PACK)],
    ['episode', release('episode', EPISODE)],
  ]);
  const indexers = {
    getRelease: (id: string) => releases.get(id),
    resolveTorrent: vi.fn(async (release: Release) => ({
      infoHash: release.infoHash,
      magnetUrl: release.magnetUrl,
    })),
  };

  const requestEpisodes = (episodes: number[], approved = true) =>
    request(() =>
      requests.setEpisodeRequests({
        userId,
        tmdbId: SERIES,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested: true,
        approved,
      }),
    );

  const unrequestEpisodes = (episodes: number[]) =>
    request(() =>
      requests.setEpisodeRequests({
        userId,
        tmdbId: SERIES,
        episodes: episodes.map((episode) => ({ season: 1, episode })),
        requested: false,
        approved: true,
      }),
    );

  const setRule = (limits: Partial<RequestRule>) =>
    request(() =>
      requests.setSeriesRule(userId, SERIES, {
        keepNext: null,
        keepWatched: null,
        keepWatchedHours: null,
        ...limits,
      }),
    );

  /** Writes the play state of an episode, as the play states service does, and applies the rule */
  const setPlayState = async (
    episode: number,
    watched: boolean,
    watchedAt: Date | null,
  ) => {
    const em = orm.em.fork();
    const where = {
      userId,
      mediaType: MediaTypeFull.Episode,
      tmdbId: SERIES,
      season: 1,
      episode,
    };
    const playState = await em.findOne(PlayState, where);
    if (playState) {
      await em.nativeUpdate(PlayState, where, { watched, watchedAt });
    } else {
      await em.insert(PlayState, {
        ...new PlayState(),
        ...where,
        watched,
        watchedAt,
      });
    }
    await em.transactional((tx) =>
      requests.applyRule(tx, {
        userId,
        mediaType: MediaType.Series,
        tmdbId: SERIES,
      }),
    );
  };

  /** Marks an episode watched at a time; without one, as an episode marked watched before the time was stored */
  const watch = (episode: number, at: Date | null = new Date()) =>
    setPlayState(episode, true, at);
  /** Unwatched, or in progress: a play state that is not watched */
  const unwatch = (episode: number) => setPlayState(episode, false, null);
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR);

  const target = (episode: number): SelectionTarget => ({
    userId,
    tmdbId: SERIES,
    season: 1,
    episode,
  });
  const select = (episode: number, releaseId: string) =>
    request(() => requests.preferRelease(target(episode), releaseId));
  const clear = (episode: number) =>
    request(() => requests.clearPreference(target(episode)));

  const rows = () =>
    orm.em
      .fork()
      .find(
        MediaRequest,
        { mediaType: MediaTypeFull.Episode },
        { orderBy: { episode: 'asc' } },
      );

  /** Where each episode request stands */
  const standings = async () =>
    (await rows()).map((r) => [
      r.episode,
      !r.approved ? 'waiting' : !r.neededSince ? 'ahead' : 'needed',
      !!r.watchedAt,
    ]);

  /** The watch stamp of each episode's request, as a time */
  const stamps = async () =>
    Object.fromEntries(
      (await rows()).map((r) => [r.episode, r.watchedAt?.getTime() ?? null]),
    );

  const sourceOf = async (episode: number) => {
    const row = (await rows()).find((r) => r.episode === episode);
    const { source } = await request(() =>
      requests.readRequestWithSource(orm.em, row.id),
    );

    return source;
  };

  const rule = () =>
    orm.em.fork().findOne(RequestRule, { userId, tmdbId: SERIES });

  /** The episodes of the requests the library is to look at, and the ids of requests that are gone */
  const reconciled = async () => {
    const jobs = await orm.em.fork().find(Job, {
      type: 'library.reconcileRequest',
      status: JobStatus.Queued,
    });
    const requests = await rows();

    return jobs
      .map(
        (job) =>
          requests.find((r) => r.id === job.payload.requestId)?.episode ??
          `gone:${job.payload.requestId}`,
      )
      .sort();
  };
  const forgetJobs = () => orm.em.fork().nativeDelete(Job, {});

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    const metadata = {
      getSeriesByTmdbId: async () => ({
        tmdbSeries: {
          seasons: [
            {
              season_number: 1,
              episodes: [1, 2, 3, 4].map((episode_number) => ({
                episode_number,
              })),
            },
          ],
        },
      }),
      getMovieByTmdbId: async () => ({ tmdbMovie: {} }),
    };
    indexers.resolveTorrent.mockClear();
    requests = new RequestsService(
      orm.em,
      metadata as unknown as MetadataService,
      indexers as unknown as IndexersService,
      new JobsService(orm.em),
    );
  });

  afterEach(() => orm.close());

  it('lets new requests through once they have a source, and has the library look at them', async () => {
    await requestEpisodes([1, 2]);
    expect(await standings()).toEqual([
      [1, 'ahead', false],
      [2, 'ahead', false],
    ]);
    expect(await reconciled()).toEqual([]);

    await select(0, 'pack');
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'needed', false],
    ]);
    expect(await reconciled()).toEqual([1, 2]);

    // A request made with a source is let through at once
    await forgetJobs();
    await requestEpisodes([3]);
    expect(await standings()).toContainEqual([3, 'needed', false]);
    expect(await reconciled()).toEqual([3]);
  });

  it('keeps the release a user picks, resolved, and refers to it by its info hash', async () => {
    await requestEpisodes([1, 2]);
    await select(0, 'pack');
    expect(indexers.resolveTorrent).toHaveBeenCalledTimes(1);

    expect(await orm.em.fork().find(SelectedRelease, {})).toMatchObject([
      {
        infoHash: PACK,
        title: 'pack',
        indexer: 'test',
        size: 1,
        magnetUrl: `magnet:?xt=urn:btih:${PACK}`,
      },
    ]);
    expect((await rule()).seasonTorrents).toEqual([
      { season: 1, infoHash: PACK },
    ]);
    expect(await sourceOf(1)).toEqual({
      kind: 'torrent',
      infoHash: PACK,
      forEpisode: false,
    });

    // An episode's own torrent wins over the season's, as its only video
    await forgetJobs();
    await select(2, 'episode');
    expect((await rule()).episodeSources).toEqual([
      { season: 1, episode: 2, kind: 'torrent', infoHash: EPISODE },
    ]);
    expect(await sourceOf(2)).toEqual({
      kind: 'torrent',
      infoHash: EPISODE,
      forEpisode: true,
    });
    expect(await sourceOf(1)).toMatchObject({ infoHash: PACK });
    // Only the requests in scope are looked at
    expect(await reconciled()).toEqual([2]);

    // Clearing the episode's torrent falls back to the season's; the rule
    // row goes with its last preference
    await forgetJobs();
    expect(await clear(2)).toBe(true);
    expect(await sourceOf(2)).toMatchObject({ infoHash: PACK });
    expect(await reconciled()).toEqual([2]);
    expect(await clear(2)).toBe(false);
    expect(await clear(0)).toBe(true);
    expect(await sourceOf(2)).toBeUndefined();
    expect(await rule()).toBeNull();
    // Picked again, the release is known already
    await select(0, 'pack');
    expect(await orm.em.fork().count(SelectedRelease, {})).toBe(2);
  });

  it('refuses a release that is not in the search cache any more, and an episode the series does not have', async () => {
    await expect(select(0, 'expired')).rejects.toThrow(NotFoundException);
    await expect(select(9, 'pack')).rejects.toThrow(NotFoundException);
    await expect(requestEpisodes([9])).rejects.toThrow(BadRequestException);
  });

  it('applies the rule of the user: the next requests are let through, the watched ones it does not keep are deleted', async () => {
    await requestEpisodes([1, 2, 3]);
    await select(0, 'pack');
    await setRule({ keepNext: 1 });
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'needed', false],
      [3, 'needed', false],
    ]);

    // The rule set after the requests holds nothing back that passed already
    await unrequestEpisodes([2, 3]);
    await requestEpisodes([2, 3]);
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'ahead', false],
      [3, 'ahead', false],
    ]);

    await forgetJobs();
    await watch(1);
    expect(await standings()).toEqual([
      [1, 'needed', true],
      [2, 'needed', false],
      [3, 'ahead', false],
    ]);
    expect(await reconciled()).toEqual([2]);

    // Unwatching takes nothing back
    await unwatch(1);
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'needed', false],
      [3, 'ahead', false],
    ]);

    // A watched request the keep setting does not retain is deleted, and
    // the library lets go of what it had
    await setRule({ keepNext: 1, keepWatched: 1 });
    await watch(1);
    await forgetJobs();
    await watch(2);
    expect(await standings()).toEqual([
      [2, 'needed', true],
      [3, 'needed', false],
    ]);
    expect(await reconciled()).toEqual([3, expect.stringMatching(/^gone:/)]);
  });

  it('lets through the next requests after the last watched episode, and leaves the rest for later', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3]);
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'ahead', false],
      [3, 'ahead', false],
    ]);

    // An episode in progress is not watched yet: its request is the next one
    await unwatch(1);
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'ahead', false],
      [3, 'ahead', false],
    ]);

    // A skipped episode stays wanted
    await watch(2);
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'needed', true],
      [3, 'needed', false],
    ]);
  });

  it('counts the approved requests only', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await requestEpisodes([1], false);
    await requestEpisodes([2]);

    // A request that waits for approval takes no place in the window
    expect(await standings()).toEqual([
      [1, 'waiting', false],
      [2, 'needed', false],
    ]);
  });

  it('lets a request through only with a source, which takes its place in the window all the same', async () => {
    await setRule({ keepNext: 2 });
    await requestEpisodes([1, 2, 3]);
    await select(2, 'episode');
    await select(3, 'episode');
    expect(await standings()).toEqual([
      [1, 'ahead', false],
      [2, 'needed', false],
      [3, 'ahead', false],
    ]);

    // The season's torrent gives the first its source; the third stays
    // past the window
    await select(0, 'pack');
    expect(await standings()).toEqual([
      [1, 'needed', false],
      [2, 'needed', false],
      [3, 'ahead', false],
    ]);
  });

  it('stamps a request with the time its episode was watched, as the play state has it', async () => {
    await requestEpisodes([1, 2]);
    await requestEpisodes([3], false);

    const at = hoursAgo(2);
    await watch(1, at);
    expect(await stamps()).toEqual({ 1: at.getTime(), 2: null, 3: null });

    await unwatch(1);
    // Marked watched before the time was stored: long ago, approved or not
    await watch(3, null);
    expect(await stamps()).toEqual({ 1: null, 2: null, 3: 0 });
  });

  it('deletes the watched requests that are not among the last ones', async () => {
    await setRule({ keepWatched: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1);
    await watch(2);
    await watch(3);
    expect(await standings()).toEqual([
      [3, 'needed', true],
      [4, 'needed', false],
    ]);

    // Nothing is kept once nothing is left to watch
    await watch(4);
    expect(await standings()).toEqual([]);
  });

  it('keeps the last watched requests only while there is more to watch after them', async () => {
    await setRule({ keepWatched: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    // A skipped episode is not something left to watch
    await watch(2);
    await watch(3);
    await watch(4);
    expect(await standings()).toEqual([[1, 'needed', false]]);
  });

  it('deletes the watched requests that were not watched lately', async () => {
    await setRule({ keepWatchedHours: 24 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1, hoursAgo(30));
    await watch(3, hoursAgo(20));
    expect(await standings()).toEqual([
      [2, 'needed', false],
      [3, 'needed', true],
      [4, 'needed', false],
    ]);

    // The limit expires with time
    await setRule({ keepWatchedHours: 20 });
    expect(await standings()).toEqual([
      [2, 'needed', false],
      [4, 'needed', false],
    ]);

    // An episode watched before the time was stored was watched long ago
    await watch(2, null);
    expect(await standings()).toEqual([[4, 'needed', false]]);
  });

  it('deletes with both limits only what neither of them keeps', async () => {
    await setRule({ keepWatched: 1, keepWatchedHours: 24 });
    await select(0, 'pack');
    await requestEpisodes([1, 2, 3, 4]);

    await watch(1, hoursAgo(30));
    await watch(2, hoursAgo(20));
    await watch(3, hoursAgo(25));
    expect(await standings()).toEqual([
      [2, 'needed', true],
      [3, 'needed', true],
      [4, 'needed', false],
    ]);

    // The time limit goes on keeping what was watched lately after the end
    await watch(4);
    expect(await standings()).toEqual([
      [2, 'needed', true],
      [4, 'needed', true],
    ]);
  });

  it('deletes nothing without a keep setting', async () => {
    await setRule({ keepNext: 1 });
    await select(0, 'pack');
    await requestEpisodes([1, 2]);

    await watch(1, hoursAgo(100));
    await watch(2, hoursAgo(100));
    expect(await standings()).toEqual([
      [1, 'needed', true],
      [2, 'needed', true],
    ]);
  });

  it('makes a file the preference of an episode', async () => {
    await requestEpisodes([2]);
    await request(() => requests.preferFile(target(2), 'file-1'));

    expect((await rule()).episodeSources).toEqual([
      { season: 1, episode: 2, kind: 'file', mediaFileId: 'file-1' },
    ]);
    expect(await sourceOf(2)).toEqual({ kind: 'file', mediaFileId: 'file-1' });
    expect(await standings()).toEqual([[2, 'needed', false]]);
    expect(await reconciled()).toEqual([2]);
  });

  it('requests the episodes of files for a user, needed and pointed at the files', async () => {
    await requestEpisodes([2], false);
    const file = (id: string, mediaType: MediaType, episode = 1) => ({
      id,
      mediaType,
      tmdbId: SERIES,
      season: 1,
      episode,
      lastEpisode: episode,
    });

    expect(
      await request(() =>
        requests.requestFiles(userId, [
          { ...file('f1', MediaType.Series, 2), lastEpisode: 3 },
          file('f2', MediaType.Series, 3),
          file('f3', MediaType.Movie),
          file('f4', MediaType.Series, 9),
        ]),
      ),
    ).toEqual({ requests: 2, skipped: 2 });

    // The request that waited for approval is let through too
    expect(await standings()).toEqual([
      [2, 'needed', false],
      [3, 'needed', false],
    ]);
    // The first file of an episode gets it
    expect(await sourceOf(2)).toEqual({ kind: 'file', mediaFileId: 'f1' });
    expect(await sourceOf(3)).toEqual({ kind: 'file', mediaFileId: 'f1' });
    expect(await reconciled()).toEqual([2, 3]);
  });

  it('approves a request and takes no approval back', async () => {
    await requestEpisodes([1], false);
    await select(0, 'pack');
    const [row] = await rows();
    expect(await standings()).toEqual([[1, 'waiting', false]]);

    await expect(
      request(() => requests.update(row.id, { approved: false })),
    ).rejects.toThrow(BadRequestException);
    await request(() => requests.update(row.id, { approved: true }));
    expect(await standings()).toEqual([[1, 'needed', false]]);
    expect(await reconciled()).toEqual([1]);
  });

  it('deletes requests and has the library let go of what they had', async () => {
    await requestEpisodes([1, 2]);
    await select(0, 'pack');
    await forgetJobs();
    const [first] = await rows();

    expect(
      await orm.em
        .fork()
        .transactional((tx) => requests.deleteRequests(tx, [first.id])),
    ).toBe(1);
    expect(await standings()).toEqual([[2, 'needed', false]]);
    expect(await reconciled()).toEqual([`gone:${first.id}`]);

    await forgetJobs();
    await unrequestEpisodes([2]);
    expect(await rows()).toEqual([]);
    expect(await reconciled()).toHaveLength(1);
  });

  it('tells the library about the requests of a user that is deleted', async () => {
    await requestEpisodes([1, 2]);
    await forgetJobs();

    await orm.em
      .fork()
      .transactional((tx) => requests.userDeleting(tx, userId));

    expect(await reconciled()).toEqual([1, 2]);
  });

  it('requests a movie, which waits for a source it cannot have yet', async () => {
    const created = await request(() =>
      requests.createMovieRequest(userId, '7', true),
    );
    expect(created).toMatchObject({
      mediaType: MediaTypeFull.Movie,
      approved: true,
    });
    expect(created.neededSince).toBeFalsy();
    const read = await request(() =>
      requests.readRequestWithSource(orm.em, created.id),
    );
    expect(read).toMatchObject({ id: created.id });
    expect(read.source).toBeUndefined();

    expect(await request(() => requests.deleteMovieRequest(userId, '7'))).toBe(
      1,
    );
    expect(
      await request(() => requests.findMovieRequest(userId, '7')),
    ).toBeUndefined();
  });
});
